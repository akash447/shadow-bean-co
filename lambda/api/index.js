/**
 * Shadow Bean Co - API Lambda Handler
 * ==============================================
 * Serverless API backed by Aurora PostgreSQL (Data API).
 * Deployed behind API Gateway.
 * Authenticates via Cognito JWT tokens.
 * ==============================================
 */

const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Configuration from environment
const DB_CLUSTER_ARN = process.env.DB_CLUSTER_ARN;
const DB_SECRET_ARN = process.env.DB_SECRET_ARN;
const DB_NAME = process.env.DB_NAME || 'shadowbeanco';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'ap-south-1_jZV6770zJ';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '42vpa5vousikig0c4ohq2vmkge';
const MEDIA_BUCKET = process.env.MEDIA_BUCKET || 'shadowbeanco-media';
const MEDIA_CDN_URL = process.env.MEDIA_CDN_URL || 'https://media.shadowbeanco.net';
const MASTER_ADMIN_EMAIL = 'akasingh.singh6@gmail.com';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const rds = new RDSDataClient({ region: REGION });
const s3 = new S3Client({ region: REGION });

// UPI / Gmail configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const UPI_ID = process.env.UPI_ID || '8765280251@ybl';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'akasingh.singh6@gmail.com';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// JWT verifier for Cognito tokens
const verifier = CognitoJwtVerifier.create({
    userPoolId: COGNITO_USER_POOL_ID,
    tokenUse: 'id',
    clientId: COGNITO_CLIENT_ID,
});

// ==============================================
// DATABASE HELPER
// ==============================================

async function query(sql, parameters = []) {
    const params = parameters.map((p, i) => {
        if (p === null || p === undefined) return { name: `p${i}`, value: { isNull: true } };
        if (typeof p === 'boolean') return { name: `p${i}`, value: { booleanValue: p } };
        if (typeof p === 'number') {
            // Integers → longValue (works for INTEGER, BIGINT, LIMIT etc.)
            // Decimals → stringValue (avoids NUMERIC/DECIMAL type-casting issues)
            if (Number.isInteger(p)) return { name: `p${i}`, value: { longValue: p } };
            return { name: `p${i}`, value: { stringValue: String(p) } };
        }
        return { name: `p${i}`, value: { stringValue: String(p) } };
    });

    // Replace $1, $2 etc with :p0, :p1 for Data API
    let apiSql = sql;
    parameters.forEach((_, i) => {
        apiSql = apiSql.replace(`$${i + 1}`, `:p${i}`);
    });

    const result = await rds.send(new ExecuteStatementCommand({
        resourceArn: DB_CLUSTER_ARN,
        secretArn: DB_SECRET_ARN,
        database: DB_NAME,
        sql: apiSql,
        parameters: params,
        includeResultMetadata: true,
    }));

    // Convert Data API response to regular rows
    if (!result.records) return [];
    const columns = result.columnMetadata.map(c => c.name);
    return result.records.map(row => {
        const obj = {};
        row.forEach((field, i) => {
            if (field.isNull) obj[columns[i]] = null;
            else if (field.stringValue !== undefined) {
                const sv = field.stringValue;
                if ((sv.startsWith('[') || sv.startsWith('{')) && sv.length > 1) {
                    try { obj[columns[i]] = JSON.parse(sv); } catch { obj[columns[i]] = sv; }
                } else {
                    obj[columns[i]] = sv;
                }
            }
            else if (field.longValue !== undefined) obj[columns[i]] = field.longValue;
            else if (field.doubleValue !== undefined) obj[columns[i]] = field.doubleValue;
            else if (field.booleanValue !== undefined) obj[columns[i]] = field.booleanValue;
            else obj[columns[i]] = null;
        });
        return obj;
    });
}

// ==============================================
// AUTH HELPER
// ==============================================

async function verifyToken(event) {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.slice(7);
        const payload = await verifier.verify(token);
        return {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            groups: payload['cognito:groups'] || [],
        };
    } catch {
        return null;
    }
}

// Resolve a user identifier (cognito sub or UUID) to the profile UUID
async function resolveProfileId(identifier) {
    if (!identifier) return null;
    const rows = await query(
        'SELECT id FROM profiles WHERE id::text = $1 OR cognito_sub = $1',
        [identifier]
    );
    return rows.length ? rows[0].id : null;
}

async function isAdmin(user) {
    if (!user?.email) return false;
    // Master admin always has access
    if (user.email === MASTER_ADMIN_EMAIL) return true;
    // Check admin_users table
    const rows = await query('SELECT id FROM admin_users WHERE email = $1 AND is_active = true', [user.email]);
    return rows.length > 0;
}

// ==============================================
// UPI / GMAIL HELPERS
// ==============================================

function getGmailClient() {
    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    return google.gmail({ version: 'v1', auth: oauth2 });
}

function parseHDFCEmail(subject, body) {
    // HDFC bank credit alert format varies; extract amount, sender, UPI ref
    const result = { amount: null, senderName: null, upiRef: null, receivedAt: null };

    // Amount: "Rs.799.00" or "INR 799.00" or "Rs 799"
    const amtMatch = body.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i);
    if (amtMatch) result.amount = parseFloat(amtMatch[1].replace(/,/g, ''));

    // Sender / VPA: "from VPA xyz@upi" or "from Mr. JOHN DOE"
    const senderMatch = body.match(/(?:from|by)\s+(?:VPA\s+)?(.+?)(?:\s+(?:on|has|credited|to))/i);
    if (senderMatch) result.senderName = senderMatch[1].trim();

    // UPI Ref / UTR: "UPI Ref No. 412345678901" or "Ref No 412345678901"
    const refMatch = body.match(/(?:UPI\s*)?Ref\.?\s*(?:No\.?\s*)?:?\s*(\d{10,})/i);
    if (refMatch) result.upiRef = refMatch[1];

    // Date from email body: "on 23-02-26" or timestamp
    const dateMatch = body.match(/on\s+(\d{2}-\d{2}-\d{2,4}\s*\d{2}:\d{2}:\d{2})/i);
    if (dateMatch) {
        try { result.receivedAt = new Date(dateMatch[1]).toISOString(); } catch { }
    }

    return result;
}

async function processGmailMessage(gmail, messageId) {
    const msg = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
    const headers = msg.data.payload?.headers || [];
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';

    // Only process HDFC bank alerts
    if (!from.toLowerCase().includes('alerts@hdfcbank.net')) return null;

    // Extract body text
    let bodyText = '';
    const parts = msg.data.payload?.parts || [];
    if (parts.length) {
        const textPart = parts.find(p => p.mimeType === 'text/plain') || parts[0];
        bodyText = Buffer.from(textPart.body?.data || '', 'base64').toString('utf-8');
    } else if (msg.data.payload?.body?.data) {
        bodyText = Buffer.from(msg.data.payload.body.data, 'base64').toString('utf-8');
    }

    const parsed = parseHDFCEmail(subject, bodyText);
    if (!parsed.amount) return null;

    // Check duplicate
    const existing = await query('SELECT id FROM upi_payments WHERE gmail_message_id = $1', [messageId]);
    if (existing.length) return existing[0];

    // Insert into upi_payments
    const rows = await query(
        `INSERT INTO upi_payments (gmail_message_id, sender_name, upi_ref, amount, received_at, raw_subject, raw_body)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [messageId, parsed.senderName, parsed.upiRef, parsed.amount,
         parsed.receivedAt || new Date().toISOString(), subject, bodyText]
    );

    if (rows.length) {
        await autoMatchPayment(rows[0].id, parsed.amount, parsed.upiRef);
    }

    return rows[0] || null;
}

// Throttle: track last Gmail check time per Lambda instance
let lastGmailCheckTime = 0;
const GMAIL_CHECK_INTERVAL_MS = 15000; // check Gmail at most every 15 seconds

async function checkGmailForPendingPayments() {
    const now = Date.now();
    if (now - lastGmailCheckTime < GMAIL_CHECK_INTERVAL_MS) return; // throttled
    lastGmailCheckTime = now;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
        console.log('Gmail OAuth not configured, skipping check');
        return;
    }

    try {
        const gmail = getGmailClient();

        // Search for recent HDFC credit alert emails (last 1 hour)
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'from:alerts@hdfcbank.net subject:credit newer_than:1h',
            maxResults: 10,
        });

        const messages = res.data.messages || [];
        console.log(`Gmail check: found ${messages.length} recent HDFC emails`);

        for (const m of messages) {
            await processGmailMessage(gmail, m.id);
        }
    } catch (err) {
        console.error('Gmail on-demand check error:', err.message);
    }
}

async function autoMatchPayment(upiPaymentId, amount, upiRef) {
    // Find pending UPI orders with matching amount, created within last 24h
    const candidates = await query(
        `SELECT id, total_amount FROM orders
         WHERE payment_method = 'upi' AND payment_status = 'pending'
         AND total_amount = $1 AND created_at > NOW() - INTERVAL '24 hours'
         ORDER BY created_at DESC`,
        [amount]
    );

    if (candidates.length === 1) {
        const orderId = candidates[0].id;
        // Auto-match
        await query(
            `UPDATE upi_payments SET status = 'matched', matched_order_id = $1::uuid WHERE id = $2::uuid`,
            [orderId, upiPaymentId]
        );
        await query(
            `UPDATE orders SET payment_status = 'detected', upi_ref_number = $1 WHERE id = $2::uuid`,
            [upiRef, orderId]
        );
        console.log(`Auto-matched UPI payment ${upiPaymentId} to order ${orderId}`);

        // Send notifications
        try {
            const orderRows = await query(
                `SELECT o.*, p.email as user_email, p.full_name as user_name
                 FROM orders o LEFT JOIN profiles p ON o.user_id = p.id
                 WHERE o.id = $1::uuid`, [orderId]
            );
            if (orderRows.length) {
                const order = orderRows[0];
                await sendEmail(ADMIN_EMAIL, 'UPI Payment Detected',
                    `<h3>UPI payment auto-matched</h3>
                     <p>Amount: ₹${amount}</p>
                     <p>Order: ${orderId}</p>
                     <p>Customer: ${order.user_name} (${order.user_email})</p>
                     <p>UPI Ref: ${upiRef || 'N/A'}</p>`
                );
                if (order.user_email) {
                    await sendEmail(order.user_email, 'Payment Received - Shadow Bean Co',
                        `<h3>We received your payment!</h3>
                         <p>Your UPI payment of ₹${amount} for order ${orderId.slice(0, 8)} has been detected.</p>
                         <p>We'll confirm it shortly.</p>`
                    );
                }
            }
        } catch (emailErr) {
            console.error('Notification email error:', emailErr);
        }

        return true;
    }

    console.log(`No unique auto-match for amount ₹${amount} (${candidates.length} candidates)`);
    return false;
}

async function sendEmail(to, subject, html) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log('SMTP not configured, skipping email to:', to, subject);
        return;
    }
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST, port: 587, secure: false,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
        from: `"Shadow Bean Co" <${SMTP_USER}>`,
        to, subject, html,
    });
}

async function ensureUpiTables() {
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) DEFAULT 'cod'`).catch(() => {});
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'`).catch(() => {});
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS upi_ref_number VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS gmail_message_id VARCHAR(255)`).catch(() => {});
    await query(`CREATE TABLE IF NOT EXISTS upi_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gmail_message_id VARCHAR(255) UNIQUE,
        sender_name TEXT, upi_ref VARCHAR(100), amount DECIMAL(10,2),
        received_at TIMESTAMPTZ, status VARCHAR(20) DEFAULT 'unmatched',
        matched_order_id UUID, raw_subject TEXT, raw_body TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(() => {});
}

// ==============================================
// RESPONSE HELPERS
// ==============================================

const ALLOWED_ORIGINS = [
    'https://shadowbeanco.net',
    'https://www.shadowbeanco.net',
    'https://admin.shadowbeanco.net',
    'https://admin-shadowbeanco.com',
    'https://www.admin-shadowbeanco.com',
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8098',
];

function getCorsHeaders(event) {
    const origin = event?.headers?.origin || event?.headers?.Origin || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    };
}

// These get set per-request in the handler
let CORS_HEADERS = {};

function ok(body) {
    return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function created(body) {
    return { statusCode: 201, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function error(statusCode, message) {
    return { statusCode, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: message }) };
}

// ==============================================
// ROUTER
// ==============================================

exports.handler = async (event) => {
    // Set CORS headers per-request
    CORS_HEADERS = getCorsHeaders(event);

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }

    const method = event.httpMethod;
    const path = event.path || event.rawPath || '';
    const qs = event.queryStringParameters || {};

    let body = {};
    try {
        body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};
    } catch (parseErr) {
        console.error('Body parse error:', parseErr);
        return error(400, 'Invalid request body');
    }

    console.log(`${method} ${path}`, JSON.stringify({ qs, bodyKeys: Object.keys(body) }));

    try {
        // --- PUBLIC ROUTES ---

        // GET /products
        if (method === 'GET' && path === '/products') {
            const rows = await query('SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC');
            return ok(rows);
        }

        // GET /products/:id
        if (method === 'GET' && path.match(/^\/products\/[\w-]+$/)) {
            const id = path.split('/')[2];
            const rows = await query('SELECT * FROM products WHERE id::text = $1', [id]);
            return rows.length ? ok(rows[0]) : error(404, 'Product not found');
        }

        // GET /reviews
        if (method === 'GET' && path === '/reviews') {
            const limit = parseInt(qs.limit || '10', 10);
            const rows = await query(
                `SELECT r.*, p.full_name as user_name
                 FROM reviews r
                 LEFT JOIN profiles p ON r.user_id = p.id
                 WHERE r.is_approved = true
                 ORDER BY r.rating DESC LIMIT $1`,
                [limit]
            );
            return ok(rows);
        }

        // GET /pricing/active
        if (method === 'GET' && path === '/pricing/active') {
            const rows = await query('SELECT * FROM pricing WHERE is_active = true LIMIT 1');
            return ok(rows[0] || null);
        }

        // GET /terms/active
        if (method === 'GET' && path === '/terms/active') {
            const rows = await query('SELECT * FROM terms_and_conditions WHERE is_active = true LIMIT 1');
            return ok(rows[0] || null);
        }

        // GET /assets
        if (method === 'GET' && path === '/assets') {
            const rows = await query('SELECT * FROM app_assets ORDER BY created_at DESC');
            return ok(rows);
        }

        // GET /assets/:key
        if (method === 'GET' && path.match(/^\/assets\/[\w-]+$/)) {
            const key = path.split('/')[2];
            const rows = await query('SELECT * FROM app_assets WHERE key = $1', [key]);
            return ok(rows[0] || null);
        }

        // --- AUTHENTICATED ROUTES ---

        const user = await verifyToken(event);
        if (!user) return error(401, 'Unauthorized');

        // POST /profiles/ensure
        if (method === 'POST' && path === '/profiles/ensure') {
            const emailToUse = body.email || user.email;
            const nameToUse = body.full_name || user.name || '';

            // 1. Try by cognito_sub first
            let rows = await query('SELECT * FROM profiles WHERE cognito_sub = $1', [user.sub]);
            if (rows.length) {
                // Update email/name in case they changed
                await query('UPDATE profiles SET email = $1, full_name = COALESCE(NULLIF($2,\'\'), full_name) WHERE cognito_sub = $3', [emailToUse, nameToUse, user.sub]);
                return ok(rows[0]);
            }

            // 2. Try by email (same person, different sub — e.g. Google vs email login)
            rows = await query('SELECT * FROM profiles WHERE email = $1', [emailToUse]);
            if (rows.length) {
                // Link this cognito_sub to the existing profile
                await query('UPDATE profiles SET cognito_sub = $1, full_name = COALESCE(NULLIF($2,\'\'), full_name) WHERE email = $3', [user.sub, nameToUse, emailToUse]);
                return ok(rows[0]);
            }

            // 3. Create new profile
            const newRows = await query(
                'INSERT INTO profiles (cognito_sub, email, full_name) VALUES ($1, $2, $3) RETURNING *',
                [user.sub, emailToUse, nameToUse]
            );
            return created(newRows[0]);
        }

        // GET /profiles/:id
        if (method === 'GET' && path.match(/^\/profiles\/[\w-]+$/)) {
            const id = path.split('/')[2];
            const rows = await query('SELECT * FROM profiles WHERE id::text = $1 OR cognito_sub = $1', [id]);
            return ok(rows[0] || null);
        }

        // PUT /profiles/:id
        if (method === 'PUT' && path.match(/^\/profiles\/[\w-]+$/)) {
            const id = path.split('/')[2];
            const rows = await query(
                'UPDATE profiles SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), avatar_url = COALESCE($3, avatar_url) WHERE id::text = $4 OR cognito_sub = $4 RETURNING *',
                [body.full_name, body.phone, body.avatar_url, id]
            );
            return ok(rows[0]);
        }

        // GET /taste-profiles
        if (method === 'GET' && path === '/taste-profiles') {
            const profileId = await resolveProfileId(qs.user_id);
            if (!profileId) return ok([]);
            const rows = await query('SELECT * FROM taste_profiles WHERE user_id = $1::uuid ORDER BY created_at DESC', [profileId]);
            return ok(rows);
        }

        // POST /taste-profiles
        if (method === 'POST' && path === '/taste-profiles') {
            const profileId = await resolveProfileId(body.user_id);
            if (!profileId) return error(400, 'User profile not found');
            const rows = await query(
                'INSERT INTO taste_profiles (user_id, name, bitterness, acidity, body, flavour, roast_level, grind_type) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [profileId, body.name, body.bitterness, body.acidity, body.body, body.flavour, body.roast_level, body.grind_type]
            );
            return created(rows[0]);
        }

        // DELETE /taste-profiles/:id
        if (method === 'DELETE' && path.match(/^\/taste-profiles\/[\w-]+$/)) {
            const id = path.split('/')[2];
            const uid = body.user_id || qs.user_id;
            const profileId = uid ? await resolveProfileId(uid) : null;
            // Allow delete if profileId matches, or if no user_id provided just delete by id
            if (profileId) {
                await query('DELETE FROM taste_profiles WHERE id::text = $1 AND user_id = $2::uuid', [id, profileId]);
            } else {
                await query('DELETE FROM taste_profiles WHERE id::text = $1', [id]);
            }
            return ok({ deleted: true });
        }

        // GET /addresses
        if (method === 'GET' && path === '/addresses') {
            const profileId = await resolveProfileId(qs.user_id);
            if (!profileId) return ok([]);
            const rows = await query('SELECT * FROM addresses WHERE user_id = $1::uuid ORDER BY is_default DESC, created_at DESC', [profileId]);
            return ok(rows);
        }

        // POST /addresses
        if (method === 'POST' && path === '/addresses') {
            const profileId = await resolveProfileId(body.user_id);
            if (!profileId) return error(400, 'User profile not found');
            const rows = await query(
                'INSERT INTO addresses (user_id, label, full_name, phone, address_line, city, state, pincode, country, is_default) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
                [profileId, body.label, body.full_name, body.phone, body.address_line, body.city, body.state, body.pincode, body.country || 'India', body.is_default || false]
            );
            return created(rows[0]);
        }

        // GET /orders
        if (method === 'GET' && path === '/orders') {
            const profileId = await resolveProfileId(qs.user_id);
            if (!profileId) return ok([]);
            const rows = await query(
                `SELECT o.*, json_agg(oi.*) as order_items
                 FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
                 WHERE o.user_id = $1::uuid
                 GROUP BY o.id ORDER BY o.created_at DESC`,
                [profileId]
            );
            return ok(rows);
        }

        // POST /orders
        if (method === 'POST' && path === '/orders') {
            console.log('Creating order for user:', body.user_id, 'amount:', body.total_amount, 'payment:', body.payment_method);
            const profileId = await resolveProfileId(body.user_id);
            console.log('Resolved profileId:', profileId);
            if (!profileId) return error(400, 'User profile not found. Please ensure your profile is set up.');

            await ensureUpiTables();

            const paymentMethod = body.payment_method || 'cod';
            const paymentStatus = paymentMethod === 'upi' ? 'pending' : 'pending';
            const razorpayId = paymentMethod === 'upi' ? null : (body.razorpay_payment_id || 'COD-' + Date.now());

            const orderRows = await query(
                'INSERT INTO orders (user_id, status, total_amount, razorpay_payment_id, shipping_address, payment_method, payment_status) VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6, $7) RETURNING *',
                [profileId, 'pending', body.total_amount, razorpayId, JSON.stringify(body.shipping_address), paymentMethod, paymentStatus]
            );
            const order = orderRows[0];

            if (body.items?.length) {
                for (const item of body.items) {
                    // taste_profile_id may be null or a client-generated id — only insert valid UUIDs
                    const tpId = item.taste_profile_id && /^[0-9a-f-]{36}$/i.test(item.taste_profile_id) ? item.taste_profile_id : null;
                    if (tpId) {
                        await query(
                            'INSERT INTO order_items (order_id, taste_profile_id, taste_profile_name, quantity, unit_price) VALUES ($1::uuid, $2::uuid, $3, $4, $5)',
                            [order.id, tpId, item.taste_profile_name, item.quantity, item.unit_price]
                        );
                    } else {
                        await query(
                            'INSERT INTO order_items (order_id, taste_profile_name, quantity, unit_price) VALUES ($1::uuid, $2, $3, $4)',
                            [order.id, item.taste_profile_name, item.quantity, item.unit_price]
                        );
                    }
                }
            }

            return created(order);
        }

        // GET /orders/:id/payment-status
        if (method === 'GET' && path.match(/^\/orders\/[\w-]+\/payment-status$/)) {
            const id = path.split('/')[2];
            await ensureUpiTables();
            const rows = await query(
                'SELECT payment_status, payment_method, upi_ref_number FROM orders WHERE id::text = $1',
                [id]
            );
            if (!rows.length) return error(404, 'Order not found');

            // If UPI and still pending, check Gmail for new HDFC emails
            if (rows[0].payment_method === 'upi' && rows[0].payment_status === 'pending') {
                await checkGmailForPendingPayments();
                // Re-fetch in case it was just matched
                const updated = await query(
                    'SELECT payment_status, payment_method, upi_ref_number FROM orders WHERE id::text = $1',
                    [id]
                );
                if (updated.length) return ok(updated[0]);
            }

            return ok(rows[0]);
        }

        // POST /reviews
        if (method === 'POST' && path === '/reviews') {
            const profileId = await resolveProfileId(body.user_id);
            if (!profileId) return error(400, 'User profile not found');
            // Ensure reviews table has needed columns
            await query(`CREATE TABLE IF NOT EXISTS reviews (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES profiles(id),
                order_id UUID,
                rating INTEGER NOT NULL DEFAULT 5,
                comment TEXT,
                user_name TEXT,
                is_approved BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT now()
            )`).catch(() => { });
            await query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_name TEXT').catch(() => { });
            await query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false').catch(() => { });
            // Get the user's name
            const profileRows = await query('SELECT full_name FROM profiles WHERE id::text = $1', [profileId]);
            const userName = profileRows[0]?.full_name || 'Anonymous';
            const rows = await query(
                'INSERT INTO reviews (user_id, order_id, rating, comment, user_name, is_approved) VALUES ($1::uuid, $2::uuid, $3, $4, $5, false) RETURNING *',
                [profileId, body.order_id, body.rating, body.comment, userName]
            );
            return created(rows[0]);
        }

        // --- ADMIN ROUTES ---

        // POST /admin/auth/check - check if user is admin (used by admin panel login)
        if (method === 'POST' && path === '/admin/auth/check') {
            const adminCheck = await isAdmin(user);
            return ok({ isAdmin: adminCheck, email: user.email, isMaster: user.email === MASTER_ADMIN_EMAIL });
        }

        if (path.startsWith('/admin/')) {
            if (!(await isAdmin(user))) return error(403, 'Admin access required');

            // GET /admin/dashboard/stats
            if (method === 'GET' && path === '/admin/dashboard/stats') {
                const [users, orders, reviews, products, recentOrders] = await Promise.all([
                    query('SELECT COUNT(*) as count FROM profiles'),
                    query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) FILTER (WHERE status = 'pending') as pending FROM orders"),
                    query('SELECT COUNT(*) as count FROM reviews'),
                    query('SELECT COUNT(*) as count FROM products'),
                    query(`SELECT o.id, o.status, o.total_amount, o.created_at, p.full_name as user_name
                           FROM orders o LEFT JOIN profiles p ON o.user_id = p.id
                           ORDER BY o.created_at DESC LIMIT 5`),
                ]);
                return ok({
                    totalUsers: users[0]?.count || 0,
                    totalOrders: orders[0]?.count || 0,
                    totalRevenue: orders[0]?.revenue || 0,
                    pendingOrders: orders[0]?.pending || 0,
                    totalReviews: reviews[0]?.count || 0,
                    totalProducts: products[0]?.count || 0,
                    recentOrders: recentOrders || [],
                });
            }

            // GET /admin/orders (with customer info and order items)
            if (method === 'GET' && path === '/admin/orders') {
                const rows = await query(
                    `SELECT o.*, p.full_name as user_name, p.email as user_email, p.phone as user_phone
                     FROM orders o
                     LEFT JOIN profiles p ON o.user_id = p.id
                     ORDER BY o.created_at DESC`
                );
                return ok(rows);
            }

            // GET /admin/orders/:id (detailed order with items)
            if (method === 'GET' && path.match(/^\/admin\/orders\/[\w-]+$/) && !path.includes('/status') && !path.includes('/cancel')) {
                const id = path.split('/')[3];
                console.log('GET order detail:', id);
                const orderRows = await query(
                    `SELECT o.*, p.full_name as user_name, p.email as user_email, p.phone as user_phone
                     FROM orders o
                     LEFT JOIN profiles p ON o.user_id = p.id
                     WHERE o.id::text = $1`,
                    [id]
                );
                if (!orderRows.length) return error(404, 'Order not found');
                const order = orderRows[0];
                // Get order items
                let items = [];
                try {
                    items = await query(
                        `SELECT * FROM order_items WHERE order_id::text = $1`,
                        [id]
                    );
                } catch (e) { console.log('order_items query error (table may not exist):', e.message); }
                order.items = items;
                return ok(order);
            }

            // PUT /admin/orders/:id/status
            if (method === 'PUT' && path.match(/^\/admin\/orders\/[\w-]+\/status$/)) {
                const id = path.split('/')[3];
                console.log('Updating order status:', id, '->', body.status);
                const rows = await query('UPDATE orders SET status = $1 WHERE id::text = $2 RETURNING *', [body.status, id]);
                if (!rows.length) return error(404, 'Order not found');
                console.log('Order status updated:', rows[0].id, rows[0].status);
                return ok(rows[0]);
            }

            // PUT /admin/orders/:id/cancel
            if (method === 'PUT' && path.match(/^\/admin\/orders\/[\w-]+\/cancel$/)) {
                const id = path.split('/')[3];
                console.log('Cancelling order:', id, 'reason:', body.reason);
                // Ensure cancel columns exist
                await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT`).catch(() => { });
                await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ`).catch(() => { });
                const rows = await query(
                    'UPDATE orders SET status = $1, cancellation_reason = $2, cancelled_at = NOW() WHERE id::text = $3 RETURNING *',
                    ['cancelled', body.reason, id]
                );
                if (!rows.length) return error(404, 'Order not found');
                console.log('Order cancelled:', rows[0].id);
                return ok(rows[0]);
            }

            // --- UPI PAYMENT MANAGEMENT ---

            // GET /admin/upi-payments
            if (method === 'GET' && path === '/admin/upi-payments') {
                await ensureUpiTables();
                const statusFilter = qs.status;
                let sql = 'SELECT * FROM upi_payments';
                const params = [];
                if (statusFilter && statusFilter !== 'all') {
                    sql += ' WHERE status = $1';
                    params.push(statusFilter);
                }
                sql += ' ORDER BY created_at DESC';
                const rows = await query(sql, params);
                return ok(rows);
            }

            // PUT /admin/upi-payments/:id/match
            if (method === 'PUT' && path.match(/^\/admin\/upi-payments\/[\w-]+\/match$/)) {
                await ensureUpiTables();
                const id = path.split('/')[3];
                const orderId = body.order_id;
                if (!orderId) return error(400, 'order_id required');

                await query(
                    `UPDATE upi_payments SET status = 'matched', matched_order_id = $1::uuid WHERE id = $2::uuid`,
                    [orderId, id]
                );

                // Get the UPI ref to store on the order
                const upiRows = await query('SELECT upi_ref, amount FROM upi_payments WHERE id = $1::uuid', [id]);
                const upiRef = upiRows[0]?.upi_ref || null;

                await query(
                    `UPDATE orders SET payment_status = 'detected', upi_ref_number = $1, gmail_message_id = (SELECT gmail_message_id FROM upi_payments WHERE id = $2::uuid) WHERE id = $3::uuid`,
                    [upiRef, id, orderId]
                );

                return ok({ matched: true });
            }

            // PUT /admin/upi-payments/:id/confirm
            if (method === 'PUT' && path.match(/^\/admin\/upi-payments\/[\w-]+\/confirm$/)) {
                await ensureUpiTables();
                const id = path.split('/')[3];

                const upiRows = await query('SELECT matched_order_id, amount FROM upi_payments WHERE id = $1::uuid', [id]);
                if (!upiRows.length) return error(404, 'UPI payment not found');
                const orderId = upiRows[0].matched_order_id;

                await query(`UPDATE upi_payments SET status = 'confirmed' WHERE id = $1::uuid`, [id]);

                if (orderId) {
                    await query(`UPDATE orders SET payment_status = 'confirmed' WHERE id = $1::uuid`, [orderId]);

                    // Notify customer
                    try {
                        const orderRows = await query(
                            `SELECT o.total_amount, p.email, p.full_name FROM orders o
                             LEFT JOIN profiles p ON o.user_id = p.id WHERE o.id = $1::uuid`, [orderId]
                        );
                        if (orderRows.length && orderRows[0].email) {
                            await sendEmail(orderRows[0].email, 'Payment Confirmed - Shadow Bean Co',
                                `<h3>Your payment is confirmed!</h3>
                                 <p>Hi ${orderRows[0].full_name || ''},</p>
                                 <p>Your UPI payment of ₹${orderRows[0].total_amount} has been confirmed. We're processing your order now!</p>`
                            );
                        }
                    } catch (e) { console.error('Confirm email error:', e); }
                }

                return ok({ confirmed: true });
            }

            // PUT /admin/upi-payments/:id/ignore
            if (method === 'PUT' && path.match(/^\/admin\/upi-payments\/[\w-]+\/ignore$/)) {
                await ensureUpiTables();
                const id = path.split('/')[3];
                await query(`UPDATE upi_payments SET status = 'ignored' WHERE id = $1::uuid`, [id]);
                return ok({ ignored: true });
            }

            // POST /admin/upi-payments/check-gmail - manually trigger Gmail check
            if (method === 'POST' && path === '/admin/upi-payments/check-gmail') {
                await ensureUpiTables();
                if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
                    return error(400, 'Gmail OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN env vars.');
                }
                try {
                    const gmail = getGmailClient();
                    const hoursBack = parseInt(qs.hours || '2', 10);
                    const res = await gmail.users.messages.list({
                        userId: 'me',
                        q: `from:alerts@hdfcbank.net subject:credit newer_than:${hoursBack}h`,
                        maxResults: 20,
                    });
                    const messages = res.data.messages || [];
                    let processed = 0;
                    for (const m of messages) {
                        const result = await processGmailMessage(gmail, m.id);
                        if (result) processed++;
                    }
                    return ok({ checked: messages.length, processed });
                } catch (err) {
                    console.error('Admin Gmail check error:', err);
                    return error(500, 'Gmail check failed: ' + err.message);
                }
            }

            // GET /admin/profiles
            if (method === 'GET' && path === '/admin/profiles') {
                const rows = await query('SELECT * FROM profiles ORDER BY created_at DESC');
                return ok(rows);
            }

            // GET /admin/products
            if (method === 'GET' && path === '/admin/products') {
                const rows = await query('SELECT * FROM products ORDER BY created_at DESC');
                return ok(rows);
            }

            // POST /admin/products
            if (method === 'POST' && path === '/admin/products') {
                const rows = await query(
                    'INSERT INTO products (name, description, base_price, sizes, image_url, is_active) VALUES ($1, $2, $3, $4::jsonb, $5, $6) RETURNING *',
                    [body.name, body.description, body.base_price, JSON.stringify(body.sizes || []), body.image_url, body.is_active !== false]
                );
                return created(rows[0]);
            }

            // PUT /admin/products/:id
            if (method === 'PUT' && path.match(/^\/admin\/products\/[\w-]+$/)) {
                const id = path.split('/')[3];
                const rows = await query(
                    'UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), base_price = COALESCE($3, base_price), image_url = COALESCE($4, image_url), is_active = COALESCE($5, is_active) WHERE id::text = $6 RETURNING *',
                    [body.name, body.description, body.base_price, body.image_url, body.is_active, id]
                );
                return ok(rows[0]);
            }

            // DELETE /admin/products/:id
            if (method === 'DELETE' && path.match(/^\/admin\/products\/[\w-]+$/)) {
                const id = path.split('/')[3];
                await query('DELETE FROM products WHERE id::text = $1', [id]);
                return ok({ deleted: true });
            }

            // GET /admin/reviews
            if (method === 'GET' && path === '/admin/reviews') {
                const rows = await query(
                    `SELECT r.*, p.full_name as user_name
                     FROM reviews r
                     LEFT JOIN profiles p ON r.user_id = p.id
                     ORDER BY r.created_at DESC`
                );
                return ok(rows);
            }

            // PUT /admin/reviews/:id (approve/unapprove)
            if (method === 'PUT' && path.match(/^\/admin\/reviews\/[\w-]+$/)) {
                const id = path.split('/')[3];
                await query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false').catch(() => { });
                const rows = await query(
                    'UPDATE reviews SET is_approved = $1 WHERE id::text = $2 RETURNING *',
                    [body.is_approved !== false, id]
                );
                return ok(rows[0]);
            }

            // DELETE /admin/reviews/:id
            if (method === 'DELETE' && path.match(/^\/admin\/reviews\/[\w-]+$/)) {
                const id = path.split('/')[3];
                await query('DELETE FROM reviews WHERE id::text = $1', [id]);
                return ok({ deleted: true });
            }

            // GET /admin/pricing
            if (method === 'GET' && path === '/admin/pricing') {
                const rows = await query('SELECT * FROM pricing ORDER BY created_at DESC');
                return ok(rows);
            }

            // POST /admin/pricing
            if (method === 'POST' && path === '/admin/pricing') {
                const rows = await query(
                    'INSERT INTO pricing (name, description, base_price, size_100g, size_250g, size_500g, size_1kg, discount_pct, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
                    [body.name, body.description, body.base_price, body.size_100g, body.size_250g, body.size_500g, body.size_1kg, body.discount_pct, body.is_active]
                );
                return created(rows[0]);
            }

            // PUT /admin/pricing/:id
            if (method === 'PUT' && path.match(/^\/admin\/pricing\/[\w-]+$/)) {
                const id = path.split('/')[3];
                const rows = await query(
                    'UPDATE pricing SET name = COALESCE($1, name), base_price = COALESCE($2, base_price), is_active = COALESCE($3, is_active) WHERE id::text = $4 RETURNING *',
                    [body.name, body.base_price, body.is_active, id]
                );
                return ok(rows[0]);
            }

            // GET /admin/terms
            if (method === 'GET' && path === '/admin/terms') {
                const rows = await query('SELECT * FROM terms_and_conditions ORDER BY version DESC LIMIT 1');
                return ok(rows[0] || null);
            }

            // POST /admin/terms
            if (method === 'POST' && path === '/admin/terms') {
                const existing = await query('SELECT MAX(version) as max_version FROM terms_and_conditions');
                const nextVersion = (existing[0]?.max_version || 0) + 1;
                const rows = await query(
                    'INSERT INTO terms_and_conditions (content, version, is_active) VALUES ($1, $2, true) RETURNING *',
                    [body.content, nextVersion]
                );
                return created(rows[0]);
            }

            // --- ASSET/MEDIA MANAGEMENT ---

            // GET /admin/assets
            if (method === 'GET' && path === '/admin/assets') {
                const rows = await query('SELECT * FROM app_assets ORDER BY category, key ASC');
                return ok(rows);
            }

            // POST /admin/assets/upload - get pre-signed S3 URL
            if (method === 'POST' && path === '/admin/assets/upload') {
                const { filename, contentType } = body;
                if (!filename) return error(400, 'filename required');

                // Sanitize filename: lowercase, replace spaces with underscores
                const sanitized = filename.replace(/\s+/g, '_').toLowerCase();
                const s3Key = sanitized;

                const command = new PutObjectCommand({
                    Bucket: MEDIA_BUCKET,
                    Key: s3Key,
                    ContentType: contentType || 'image/png',
                });

                const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
                const cdnUrl = `${MEDIA_CDN_URL}/${s3Key}`;

                return ok({ uploadUrl, s3Key, cdnUrl });
            }

            // POST /admin/assets - create/upsert asset record
            if (method === 'POST' && path === '/admin/assets') {
                const { key, url, title, type, category } = body;
                if (!key) return error(400, 'key required');

                const cdnUrl = url || `${MEDIA_CDN_URL}/${key}`;
                const rows = await query(
                    `INSERT INTO app_assets (key, url, title, type, category)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (key) DO UPDATE SET
                       url = EXCLUDED.url, title = EXCLUDED.title,
                       type = EXCLUDED.type, category = EXCLUDED.category,
                       updated_at = NOW()
                     RETURNING *`,
                    [key, cdnUrl, title || key, type || 'image', category || 'general']
                );
                return created(rows[0]);
            }

            // PUT /admin/assets/:key - update asset record
            if (method === 'PUT' && path.match(/^\/admin\/assets\/.+$/)) {
                const key = decodeURIComponent(path.split('/').slice(3).join('/'));
                const rows = await query(
                    `UPDATE app_assets SET
                       url = COALESCE($1, url), title = COALESCE($2, title),
                       type = COALESCE($3, type), category = COALESCE($4, category),
                       updated_at = NOW()
                     WHERE key = $5 RETURNING *`,
                    [body.url, body.title, body.type, body.category, key]
                );
                return ok(rows[0]);
            }

            // DELETE /admin/assets/:key - delete from S3 + DB
            if (method === 'DELETE' && path.match(/^\/admin\/assets\/.+$/)) {
                const key = decodeURIComponent(path.split('/').slice(3).join('/'));

                // Delete from S3
                try {
                    await s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }));
                } catch (e) { /* ignore if not in S3 */ }

                // Delete from DB
                await query('DELETE FROM app_assets WHERE key = $1', [key]);
                return ok({ deleted: true, key });
            }

            // --- ADMIN ACCESS MANAGEMENT ---

            // GET /admin/access
            if (method === 'GET' && path === '/admin/access') {
                const rows = await query('SELECT * FROM admin_users ORDER BY created_at DESC');
                return ok(rows);
            }

            // POST /admin/access
            if (method === 'POST' && path === '/admin/access') {
                const rows = await query(
                    'INSERT INTO admin_users (user_id, email, role, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
                    [body.user_id, body.email, body.role || 'admin', body.is_active !== false]
                );
                return created(rows[0]);
            }

            // PUT /admin/access/:id
            if (method === 'PUT' && path.match(/^\/admin\/access\/[\w-]+$/)) {
                const id = path.split('/')[3];
                const rows = await query(
                    'UPDATE admin_users SET is_active = COALESCE($1, is_active), role = COALESCE($2, role) WHERE id::text = $3 RETURNING *',
                    [body.is_active, body.role, id]
                );
                return ok(rows[0]);
            }

            // DELETE /admin/access/:id
            if (method === 'DELETE' && path.match(/^\/admin\/access\/[\w-]+$/)) {
                const id = path.split('/')[3];
                await query('DELETE FROM admin_users WHERE id::text = $1', [id]);
                return ok({ deleted: true });
            }

            // ─── OFFERS / COUPONS ───

            // Auto-create offers table
            if (method === 'POST' && path === '/admin/offers/init') {
                await query(`
                    CREATE TABLE IF NOT EXISTS offers (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        code VARCHAR(50) UNIQUE NOT NULL,
                        description TEXT,
                        type VARCHAR(20) NOT NULL DEFAULT 'percentage',
                        value NUMERIC(10,2) NOT NULL DEFAULT 0,
                        min_order NUMERIC(10,2) DEFAULT 0,
                        max_uses INTEGER DEFAULT 0,
                        used_count INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT true,
                        expires_at TEXT,
                        created_at TIMESTAMPTZ DEFAULT now()
                    )
                `);
                return ok({ created: true });
            }

            // GET /admin/offers
            if (method === 'GET' && path === '/admin/offers') {
                await query(`
                    CREATE TABLE IF NOT EXISTS offers (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        code VARCHAR(50) UNIQUE NOT NULL,
                        description TEXT,
                        type VARCHAR(20) NOT NULL DEFAULT 'percentage',
                        value NUMERIC(10,2) NOT NULL DEFAULT 0,
                        min_order NUMERIC(10,2) DEFAULT 0,
                        max_uses INTEGER DEFAULT 0,
                        used_count INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT true,
                        expires_at TEXT,
                        created_at TIMESTAMPTZ DEFAULT now()
                    )
                `);
                const rows = await query('SELECT * FROM offers ORDER BY created_at DESC');
                return ok(rows);
            }

            // POST /admin/offers
            if (method === 'POST' && path === '/admin/offers') {
                console.log('Creating offer:', body.code, body.type, body.value);
                await query(`
                    CREATE TABLE IF NOT EXISTS offers (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        code VARCHAR(50) UNIQUE NOT NULL,
                        description TEXT,
                        type VARCHAR(20) NOT NULL DEFAULT 'percentage',
                        value NUMERIC(10,2) NOT NULL DEFAULT 0,
                        min_order NUMERIC(10,2) DEFAULT 0,
                        max_uses INTEGER DEFAULT 0,
                        used_count INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT true,
                        expires_at TEXT,
                        created_at TIMESTAMPTZ DEFAULT now()
                    )
                `);
                const rows = await query(
                    'INSERT INTO offers (code, description, type, value, min_order, max_uses, is_active, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                    [body.code?.toUpperCase(), body.description || '', body.type || 'percentage', String(body.value || 0), String(body.min_order || 0), body.max_uses || 0, body.is_active !== false, body.expires_at || null]
                );
                console.log('Offer created:', rows[0]?.id);
                return created(rows[0]);
            }

            // PUT /admin/offers/:id
            if (method === 'PUT' && path.match(/^\/admin\/offers\/[\w-]+$/)) {
                const id = path.split('/')[3];
                const rows = await query(
                    'UPDATE offers SET code = COALESCE($1, code), description = COALESCE($2, description), type = COALESCE($3, type), value = COALESCE($4, value), min_order = COALESCE($5, min_order), max_uses = COALESCE($6, max_uses), is_active = COALESCE($7, is_active), expires_at = $8 WHERE id = $9::uuid RETURNING *',
                    [body.code?.toUpperCase(), body.description, body.type, body.value != null ? String(body.value) : null, body.min_order != null ? String(body.min_order) : null, body.max_uses, body.is_active, body.expires_at || null, id]
                );
                return ok(rows[0]);
            }

            // DELETE /admin/offers/:id
            if (method === 'DELETE' && path.match(/^\/admin\/offers\/[\w-]+$/)) {
                const id = path.split('/')[3];
                await query('DELETE FROM offers WHERE id = $1::uuid', [id]);
                return ok({ deleted: true });
            }

        }

        // ─── PUBLIC: Validate offer code ───
        if (method === 'POST' && path === '/offers/validate') {
            const code = (body.code || '').toUpperCase().trim();
            const cartTotal = Number(body.cart_total) || 0;
            if (!code) return error(400, 'Code required');

            try {
                await query(
                    `CREATE TABLE IF NOT EXISTS offers (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        code VARCHAR(50) UNIQUE NOT NULL,
                        description TEXT,
                        type VARCHAR(20) NOT NULL DEFAULT 'percentage',
                        value NUMERIC(10,2) NOT NULL DEFAULT 0,
                        min_order NUMERIC(10,2) DEFAULT 0,
                        max_uses INTEGER DEFAULT 0,
                        used_count INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT true,
                        expires_at TEXT,
                        created_at TIMESTAMPTZ DEFAULT now()
                    )`
                );
            } catch (e) { /* table may already exist */ }

            const rows = await query('SELECT * FROM offers WHERE code = $1 AND is_active = true', [code]);
            if (!rows.length) return ok({ valid: false, reason: 'Invalid or inactive code' });

            const offer = rows[0];
            if (offer.expires_at && new Date(offer.expires_at) < new Date()) return ok({ valid: false, reason: 'Expired' });
            if (offer.max_uses > 0 && offer.used_count >= offer.max_uses) return ok({ valid: false, reason: 'Max uses reached' });
            if (cartTotal < Number(offer.min_order)) return ok({ valid: false, reason: `Min order ₹${offer.min_order}` });

            return ok({ valid: true, type: offer.type, value: Number(offer.value), description: offer.description });
        }

        return error(404, 'Not found');
    } catch (err) {
        console.error('API Error:', err);
        const msg = err?.message || 'Internal server error';
        return error(500, msg);
    }
};
