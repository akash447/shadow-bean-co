/**
 * Shadow Bean Co - API Lambda Handler
 * ==============================================
 * Copyright (c) 2024-2026 Akash Kumar Singh. All rights reserved.
 * This source code is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
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
const Razorpay = require('razorpay');
const crypto = require('crypto');
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

// Razorpay config — loaded from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
let _razorpayInstance = null;
function getRazorpay() {
    if (_razorpayInstance) return _razorpayInstance;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials not configured');
    }
    _razorpayInstance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    return _razorpayInstance;
}

// Shiprocket config
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const SHIPROCKET_CHANNEL_ID = process.env.SHIPROCKET_CHANNEL_ID || '';
let _shiprocketToken = null;
let _shiprocketTokenExpiry = 0;

async function getShiprocketToken() {
    if (_shiprocketToken && Date.now() < _shiprocketTokenExpiry) return _shiprocketToken;
    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
        console.log('Shiprocket credentials not configured, skipping');
        return null;
    }
    const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
    });
    if (!res.ok) { console.error('Shiprocket auth failed:', res.status); return null; }
    const data = await res.json();
    _shiprocketToken = data.token;
    _shiprocketTokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days
    return _shiprocketToken;
}

async function shiprocketFetch(endpoint, options = {}) {
    const token = await getShiprocketToken();
    if (!token) return null;
    const res = await fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`Shiprocket ${endpoint} failed:`, res.status, errText);
        return null;
    }
    return res.json();
}

async function createShiprocketOrder(order, items, shippingAddr) {
    const addr = typeof shippingAddr === 'string' ? JSON.parse(shippingAddr) : shippingAddr;
    const customerName = addr?.fullName || addr?.name || addr?.full_name || 'Customer';
    const nameParts = customerName.split(' ');

    const orderDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const paymentType = order.payment_method === 'cod' ? 'COD' : 'Prepaid';

    const shiprocketItems = (items || []).map((item, idx) => ({
        name: item.taste_profile_name || `Custom Blend ${idx + 1}`,
        sku: `SBC-${order.id.slice(0, 8)}-${idx}`,
        units: parseInt(item.quantity) || 1,
        selling_price: parseFloat(item.unit_price) || 599,
        discount: 0,
        tax: 0,
        hsn: '0901',
    }));

    const totalWeight = Math.max(0.5, shiprocketItems.reduce((sum, i) => sum + i.units * 0.3, 0));

    const payload = {
        order_id: order.id.slice(0, 8),
        order_date: orderDate,
        pickup_location: 'Shadow Bean Co',
        channel_id: SHIPROCKET_CHANNEL_ID,
        billing_customer_name: nameParts[0] || 'Customer',
        billing_last_name: nameParts.slice(1).join(' ') || '',
        billing_address: addr?.addressLine1 || addr?.address_line || addr?.address || '',
        billing_address_2: addr?.addressLine2 || '',
        billing_city: addr?.city || '',
        billing_state: addr?.state || '',
        billing_pincode: String(addr?.pincode || ''),
        billing_country: 'India',
        billing_email: order.user_email || '',
        billing_phone: String(addr?.phone || ''),
        shipping_is_billing: true,
        order_items: shiprocketItems,
        payment_method: paymentType,
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: parseFloat(order.total_amount) || 0,
        length: 20,
        breadth: 15,
        height: 10,
        weight: totalWeight,
    };

    console.log('Creating Shiprocket order:', JSON.stringify({ order_id: payload.order_id, sub_total: payload.sub_total }));
    const result = await shiprocketFetch('/orders/create/adhoc', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (result && result.shipment_id) {
        // Store shiprocket IDs in DB
        await query(
            `UPDATE orders SET shiprocket_order_id = $1, shiprocket_shipment_id = $2 WHERE id = $3::uuid`,
            [String(result.order_id), String(result.shipment_id), order.id]
        ).catch(err => console.error('Failed to store Shiprocket IDs:', err.message));
        console.log(`Shiprocket order created: order_id=${result.order_id}, shipment_id=${result.shipment_id}`);
    }
    return result;
}

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

// Verify that a requested user_id belongs to the authenticated user
async function verifyOwnership(user, requestedUserId) {
    if (!user || !requestedUserId) return false;
    const rows = await query(
        'SELECT id FROM profiles WHERE (id::text = $1 OR cognito_sub = $1) AND cognito_sub = $2',
        [requestedUserId, user.sub]
    );
    return rows.length > 0;
}

// Resolve authenticated user's own profile ID (from JWT sub)
async function resolveOwnProfileId(user) {
    if (!user?.sub) return null;
    const rows = await query('SELECT id FROM profiles WHERE cognito_sub = $1', [user.sub]);
    return rows.length ? rows[0].id : null;
}

// ==============================================
// RATE LIMITER (in-memory, per Lambda instance)
// ==============================================

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // max requests per window per IP

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);
    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return false;
    return true;
}

// Clean up stale entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) rateLimitStore.delete(ip);
    }
}, 5 * 60 * 1000);

async function isAdmin(user) {
    if (!user?.email) return false;
    // Master admin always has access
    if (user.email === MASTER_ADMIN_EMAIL) return true;
    // Check admin_users table
    const rows = await query('SELECT id FROM admin_users WHERE email = $1 AND is_active = true', [user.email]);
    return rows.length > 0;
}

// ==============================================
// EMAIL HELPER
// ==============================================

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

// ==============================================
// RESPONSE HELPERS
// ==============================================

const PROD_ORIGINS = [
    'https://shadowbeanco.net',
    'https://www.shadowbeanco.net',
    'https://admin.shadowbeanco.net',
    'https://admin-shadowbeanco.com',
    'https://www.admin-shadowbeanco.com',
];
const DEV_ORIGINS = process.env.ALLOW_DEV_CORS === 'true' ? [
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8098',
] : [];
const ALLOWED_ORIGINS = [...PROD_ORIGINS, ...DEV_ORIGINS];

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

    // Rate limiting
    const clientIp = event.requestContext?.identity?.sourceIp || event.headers?.['X-Forwarded-For']?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return { statusCode: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Retry-After': '60' }, body: JSON.stringify({ error: 'Too many requests. Please try again later.' }) };
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

        // GET /reviews — public: one approved review per user (highest rated), for homepage
        if (method === 'GET' && path === '/reviews') {
            const limit = parseInt(qs.limit || '10', 10);
            const rows = await query(
                `SELECT DISTINCT ON (r.user_id) r.*, p.full_name as user_name
                 FROM reviews r
                 LEFT JOIN profiles p ON r.user_id = p.id
                 WHERE r.is_approved = true
                 ORDER BY r.user_id, r.rating DESC, r.created_at DESC`,
                []
            );
            // Shuffle and limit for variety
            const shuffled = rows.sort(() => Math.random() - 0.5).slice(0, limit);
            return ok(shuffled);
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

        // GET /offers (public - list active offers for dropdown)
        if (method === 'GET' && path === '/offers') {
            const rows = await query(
                `SELECT code, description, type, value, min_order FROM offers
                 WHERE is_active = true
                   AND (expires_at IS NULL OR expires_at > NOW())
                   AND (max_uses = 0 OR used_count < max_uses)
                 ORDER BY created_at DESC LIMIT 5`
            ).catch(() => []);
            return ok(rows.map(r => ({ code: r.code, description: r.description, type: r.type, value: Number(r.value), min_order: Number(r.min_order) })));
        }

        // POST /offers/validate (public - validate a coupon code)
        if (method === 'POST' && path === '/offers/validate') {
            const code = (body.code || '').toUpperCase().trim();
            const cartTotal = Number(body.cart_total) || 0;
            if (!code) return error(400, 'Code required');

            const rows = await query('SELECT * FROM offers WHERE code = $1 AND is_active = true', [code]).catch(() => []);
            if (!rows.length) return ok({ valid: false, reason: 'Invalid or inactive code' });

            const offer = rows[0];
            if (offer.expires_at && new Date(offer.expires_at) < new Date()) return ok({ valid: false, reason: 'Expired' });
            if (offer.max_uses > 0 && offer.used_count >= offer.max_uses) return ok({ valid: false, reason: 'Max uses reached' });
            if (cartTotal < Number(offer.min_order)) return ok({ valid: false, reason: `Min order ₹${offer.min_order}` });

            return ok({ valid: true, type: offer.type, value: Number(offer.value), description: offer.description });
        }

        // --- AUTHENTICATED ROUTES ---

        const user = await verifyToken(event);
        if (!user) return error(401, 'Unauthorized');

        // POST /profiles/ensure
        if (method === 'POST' && path === '/profiles/ensure') {
            // SECURITY: Always use email from verified JWT, never from request body
            const emailToUse = user.email;
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
            // Users can only view their own profile
            if (!(await verifyOwnership(user, id))) return error(403, 'Access denied');
            const rows = await query('SELECT * FROM profiles WHERE id::text = $1 OR cognito_sub = $1', [id]);
            return ok(rows[0] || null);
        }

        // PUT /profiles/:id
        if (method === 'PUT' && path.match(/^\/profiles\/[\w-]+$/)) {
            const id = path.split('/')[2];
            // Users can only update their own profile
            if (!(await verifyOwnership(user, id))) return error(403, 'Access denied');
            const rows = await query(
                'UPDATE profiles SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), avatar_url = COALESCE($3, avatar_url) WHERE id::text = $4 OR cognito_sub = $4 RETURNING *',
                [body.full_name, body.phone, body.avatar_url, id]
            );
            return ok(rows[0]);
        }

        // GET /taste-profiles
        if (method === 'GET' && path === '/taste-profiles') {
            // Always use authenticated user's own profile
            const profileId = await resolveOwnProfileId(user);
            if (!profileId) return ok([]);
            const rows = await query('SELECT * FROM taste_profiles WHERE user_id = $1::uuid ORDER BY created_at DESC', [profileId]);
            return ok(rows);
        }

        // POST /taste-profiles
        if (method === 'POST' && path === '/taste-profiles') {
            // Always use authenticated user's own profile
            const profileId = await resolveOwnProfileId(user);
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
            // Only delete if it belongs to the authenticated user
            const profileId = await resolveOwnProfileId(user);
            if (!profileId) return error(403, 'Access denied');
            await query('DELETE FROM taste_profiles WHERE id::text = $1 AND user_id = $2::uuid', [id, profileId]);
            return ok({ deleted: true });
        }

        // GET /addresses
        if (method === 'GET' && path === '/addresses') {
            // Always use authenticated user's own profile
            const profileId = await resolveOwnProfileId(user);
            if (!profileId) return ok([]);
            const rows = await query('SELECT * FROM addresses WHERE user_id = $1::uuid ORDER BY is_default DESC, created_at DESC', [profileId]);
            return ok(rows);
        }

        // POST /addresses
        if (method === 'POST' && path === '/addresses') {
            // Always use authenticated user's own profile
            const profileId = await resolveOwnProfileId(user);
            if (!profileId) return error(400, 'User profile not found');
            const rows = await query(
                'INSERT INTO addresses (user_id, label, full_name, phone, address_line, city, state, pincode, country, is_default) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
                [profileId, body.label, body.full_name, body.phone, body.address_line, body.city, body.state, body.pincode, body.country || 'India', body.is_default || false]
            );
            return created(rows[0]);
        }

        // GET /orders
        if (method === 'GET' && path === '/orders') {
            // Always use authenticated user's own profile
            const profileId = await resolveOwnProfileId(user);
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
            // Always use authenticated user's own profile
            const profileId = await resolveOwnProfileId(user);
            if (!profileId) return error(400, 'User profile not found. Please ensure your profile is set up.');

            // Ensure razorpay_order_id column exists
            await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255)`).catch(() => {});

            // SECURITY: Validate items and calculate total server-side
            const items = body.items || [];
            if (!items.length) return error(400, 'Order must have at least one item');
            if (!body.shipping_address) return error(400, 'Shipping address required');

            // Fetch active pricing to validate unit prices
            const pricingRows = await query('SELECT * FROM pricing WHERE is_active = true LIMIT 1');
            const pricing = pricingRows[0];
            const serverUnitPrice = pricing ? Number(pricing.size_250g || pricing.base_price || 599) : 599;

            let serverTotal = 0;
            const validatedItems = [];
            for (const item of items) {
                const qty = Math.max(1, Math.min(100, parseInt(item.quantity) || 1));
                // Use server-side price, ignore client-submitted unit_price
                serverTotal += serverUnitPrice * qty;
                validatedItems.push({
                    taste_profile_id: item.taste_profile_id,
                    taste_profile_name: String(item.taste_profile_name || 'Custom Blend').slice(0, 200),
                    quantity: qty,
                    unit_price: serverUnitPrice,
                });
            }

            // Apply discount/coupon if provided
            let discountAmount = 0;
            const discountCode = (body.discount_code || '').toUpperCase().trim();
            if (discountCode) {
                const offerRows = await query('SELECT * FROM offers WHERE code = $1 AND is_active = true', [discountCode]).catch(() => []);
                if (offerRows.length) {
                    const offer = offerRows[0];
                    const notExpired = !offer.expires_at || new Date(offer.expires_at) > new Date();
                    const notMaxed = !offer.max_uses || offer.used_count < offer.max_uses;
                    const meetsMin = serverTotal >= Number(offer.min_order || 0);
                    if (notExpired && notMaxed && meetsMin) {
                        if (offer.type === 'percentage') {
                            discountAmount = Math.round(serverTotal * Number(offer.value) / 100);
                        } else {
                            discountAmount = Math.min(Number(offer.value), serverTotal);
                        }
                        // Increment used_count
                        await query('UPDATE offers SET used_count = used_count + 1 WHERE id = $1::uuid', [offer.id]).catch(() => {});
                    }
                }
            }
            serverTotal = Math.max(1, serverTotal - discountAmount); // min ₹1 for Razorpay

            // Sanity check: total must be reasonable
            if (serverTotal <= 0 || serverTotal > 100000) return error(400, 'Invalid order total');

            const paymentMethod = ['cod', 'razorpay'].includes(body.payment_method) ? body.payment_method : 'cod';
            const paymentStatus = 'pending';

            // Create Razorpay order if payment method is razorpay
            let razorpayOrderId = null;
            if (paymentMethod === 'razorpay') {
                const rzp = getRazorpay();
                const rzpOrder = await rzp.orders.create({
                    amount: serverTotal * 100, // Razorpay expects paise
                    currency: 'INR',
                    receipt: `order_${Date.now()}`,
                });
                razorpayOrderId = rzpOrder.id;
            }

            const orderRows = await query(
                'INSERT INTO orders (user_id, status, total_amount, shipping_address, payment_method, payment_status, razorpay_order_id) VALUES ($1::uuid, $2, $3, $4::jsonb, $5, $6, $7) RETURNING *',
                [profileId, 'pending', serverTotal, JSON.stringify(body.shipping_address), paymentMethod, paymentStatus, razorpayOrderId]
            );
            const order = orderRows[0];

            for (const item of validatedItems) {
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

            return created(order);
        }

        // GET /orders/:id/payment-status
        if (method === 'GET' && path.match(/^\/orders\/[\w-]+\/payment-status$/)) {
            const id = path.split('/')[2];
            const ownProfileId = await resolveOwnProfileId(user);
            const rows = await query(
                'SELECT payment_status, payment_method, razorpay_payment_id FROM orders WHERE id::text = $1 AND user_id = $2::uuid',
                [id, ownProfileId]
            );
            if (!rows.length) return error(404, 'Order not found');
            return ok(rows[0]);
        }

        // GET /orders/:id/tracking — get Shiprocket tracking info
        if (method === 'GET' && path.match(/^\/orders\/[\w-]+\/tracking$/)) {
            const id = path.split('/')[2];
            const ownProfileId = await resolveOwnProfileId(user);
            const rows = await query(
                'SELECT shiprocket_shipment_id, tracking_url, status FROM orders WHERE id::text = $1 AND user_id = $2::uuid',
                [id, ownProfileId]
            );
            if (!rows.length) return error(404, 'Order not found');
            const order = rows[0];
            if (!order.shiprocket_shipment_id) return ok({ tracking: null, message: 'Shipment not yet created' });

            // Fetch live tracking from Shiprocket
            try {
                const trackData = await shiprocketFetch(`/courier/track/shipment/${order.shiprocket_shipment_id}`);
                if (trackData?.tracking_data) {
                    // Store tracking URL if available
                    const trackUrl = trackData.tracking_data.track_url;
                    if (trackUrl && trackUrl !== order.tracking_url) {
                        await query('UPDATE orders SET tracking_url = $1 WHERE id::text = $2', [trackUrl, id]).catch(() => {});
                    }
                    return ok({ tracking: trackData.tracking_data });
                }
            } catch (trackErr) {
                console.error('Shiprocket tracking error:', trackErr);
            }
            return ok({ tracking: null, tracking_url: order.tracking_url });
        }

        // POST /orders/:id/verify-payment — Razorpay signature verification
        if (method === 'POST' && path.match(/^\/orders\/[\w-]+\/verify-payment$/)) {
            const id = path.split('/')[2];
            const ownProfileId = await resolveOwnProfileId(user);
            const rows = await query(
                'SELECT payment_status, payment_method, total_amount, razorpay_order_id FROM orders WHERE id::text = $1 AND user_id = $2::uuid',
                [id, ownProfileId]
            );
            if (!rows.length) return error(404, 'Order not found');
            if (rows[0].payment_method !== 'razorpay') return error(400, 'Not a Razorpay order');

            // Already paid — return immediately
            if (rows[0].payment_status === 'paid') {
                return ok({ payment_status: 'paid', verified: true });
            }

            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
            if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
                return error(400, 'Missing Razorpay payment details');
            }

            // Verify that the order_id matches what we have in DB
            if (razorpay_order_id !== rows[0].razorpay_order_id) {
                return error(400, 'Razorpay order ID mismatch');
            }

            // HMAC SHA256 signature verification
            const expectedSignature = crypto
                .createHmac('sha256', RAZORPAY_KEY_SECRET)
                .update(razorpay_order_id + '|' + razorpay_payment_id)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return error(400, 'Payment verification failed — invalid signature');
            }

            // Signature valid — update order
            await query(
                `UPDATE orders SET payment_status = 'paid', status = 'confirmed', razorpay_payment_id = $1 WHERE id::text = $2`,
                [razorpay_payment_id, id]
            );

            // Send confirmation emails
            try {
                const orderRows = await query(
                    `SELECT o.*, p.email as user_email, p.full_name as user_name
                     FROM orders o LEFT JOIN profiles p ON o.user_id = p.id
                     WHERE o.id::text = $1`, [id]
                );
                if (orderRows.length) {
                    const order = orderRows[0];
                    await sendEmail(ADMIN_EMAIL, 'New Order Confirmed - Shadow Bean Co',
                        `<h3>New order confirmed via Razorpay</h3>
                         <p>Amount: ₹${order.total_amount}</p>
                         <p>Order: ${id}</p>
                         <p>Customer: ${order.user_name} (${order.user_email})</p>
                         <p>Payment ID: ${razorpay_payment_id}</p>`
                    );
                    if (order.user_email) {
                        await sendEmail(order.user_email, 'Order Confirmed - Shadow Bean Co',
                            `<h3>Your order is confirmed!</h3>
                             <p>Hi ${order.user_name || ''},</p>
                             <p>Your payment of ₹${order.total_amount} for order ${id.slice(0, 8)} has been confirmed.</p>
                             <p>We'll start preparing your custom blend right away!</p>`
                        );
                    }
                }
            } catch (emailErr) {
                console.error('Confirmation email error:', emailErr);
            }

            // Create Shiprocket order for fulfillment
            try {
                const fullOrder = await query(
                    `SELECT o.*, p.email as user_email, p.full_name as user_name
                     FROM orders o LEFT JOIN profiles p ON o.user_id = p.id
                     WHERE o.id::text = $1`, [id]
                );
                if (fullOrder.length) {
                    const orderItems = await query('SELECT * FROM order_items WHERE order_id::text = $1', [id]);
                    await createShiprocketOrder(fullOrder[0], orderItems, fullOrder[0].shipping_address);
                }
            } catch (shipErr) {
                console.error('Shiprocket order creation error:', shipErr);
            }

            return ok({ payment_status: 'paid', verified: true });
        }

        // POST /reviews
        if (method === 'POST' && path === '/reviews') {
            // Always use authenticated user's own profile
            const profileId = await resolveOwnProfileId(user);
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

            // Validate inputs
            const rating = Math.max(1, Math.min(5, parseInt(body.rating) || 5));
            const comment = String(body.comment || '').slice(0, 2000);
            // Verify order belongs to user (if provided)
            let orderId = null;
            if (body.order_id) {
                const orderCheck = await query(
                    'SELECT id FROM orders WHERE id::text = $1 AND user_id = $2::uuid',
                    [body.order_id, profileId]
                );
                if (orderCheck.length) orderId = body.order_id;
            }

            const profileRows = await query('SELECT full_name FROM profiles WHERE id::text = $1', [profileId]);
            const userName = profileRows[0]?.full_name || 'Anonymous';
            const rows = await query(
                'INSERT INTO reviews (user_id, order_id, rating, comment, user_name, is_approved) VALUES ($1::uuid, $2::uuid, $3, $4, $5, false) RETURNING *',
                [profileId, orderId, rating, comment, userName]
            );
            return created(rows[0]);
        }

        // GET /reviews/mine — user's own reviews (for dashboard)
        if (method === 'GET' && path === '/reviews/mine') {
            const profileId = await resolveOwnProfileId(user);
            if (!profileId) return ok([]);
            const rows = await query(
                'SELECT * FROM reviews WHERE user_id = $1::uuid ORDER BY created_at DESC',
                [profileId]
            );
            return ok(rows);
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

                // Auto-create Shiprocket order when confirmed (if not already created)
                if (body.status === 'confirmed' && !rows[0].shiprocket_order_id) {
                    try {
                        const fullOrder = await query(
                            `SELECT o.*, p.email as user_email, p.full_name as user_name
                             FROM orders o LEFT JOIN profiles p ON o.user_id = p.id
                             WHERE o.id::text = $1`, [id]
                        );
                        if (fullOrder.length) {
                            const orderItems = await query('SELECT * FROM order_items WHERE order_id::text = $1', [id]);
                            await createShiprocketOrder(fullOrder[0], orderItems, fullOrder[0].shipping_address);
                        }
                    } catch (shipErr) {
                        console.error('Shiprocket order creation error (admin):', shipErr);
                    }
                }

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

                // Validate content type — only allow images and videos
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'];
                const safeType = allowedTypes.includes(contentType) ? contentType : 'image/png';

                // Sanitize filename: strip path traversal, allow only safe chars
                const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
                const s3Key = `assets/${sanitized}`;

                const command = new PutObjectCommand({
                    Bucket: MEDIA_BUCKET,
                    Key: s3Key,
                    ContentType: safeType,
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

            // POST /admin/access — master admin only
            if (method === 'POST' && path === '/admin/access') {
                if (user.email !== MASTER_ADMIN_EMAIL) return error(403, 'Only master admin can manage access');
                const rows = await query(
                    'INSERT INTO admin_users (user_id, email, role, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
                    [body.user_id, body.email, body.role || 'admin', body.is_active !== false]
                );
                return created(rows[0]);
            }

            // PUT /admin/access/:id — master admin only
            if (method === 'PUT' && path.match(/^\/admin\/access\/[\w-]+$/)) {
                if (user.email !== MASTER_ADMIN_EMAIL) return error(403, 'Only master admin can manage access');
                const id = path.split('/')[3];
                const rows = await query(
                    'UPDATE admin_users SET is_active = COALESCE($1, is_active), role = COALESCE($2, role) WHERE id::text = $3 RETURNING *',
                    [body.is_active, body.role, id]
                );
                return ok(rows[0]);
            }

            // DELETE /admin/access/:id — master admin only
            if (method === 'DELETE' && path.match(/^\/admin\/access\/[\w-]+$/)) {
                if (user.email !== MASTER_ADMIN_EMAIL) return error(403, 'Only master admin can manage access');
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
                        expires_at TIMESTAMPTZ,
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
                        expires_at TIMESTAMPTZ,
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
                        expires_at TIMESTAMPTZ,
                        created_at TIMESTAMPTZ DEFAULT now()
                    )
                `);
                const rows = await query(
                    'INSERT INTO offers (code, description, type, value, min_order, max_uses, is_active, expires_at) VALUES ($1, $2, $3, $4::NUMERIC, $5::NUMERIC, $6, $7, $8::TIMESTAMPTZ) RETURNING *',
                    [body.code?.toUpperCase(), body.description || '', body.type || 'percentage', String(body.value || 0), String(body.min_order || 0), body.max_uses || 0, body.is_active !== false, body.expires_at || null]
                );
                console.log('Offer created:', rows[0]?.id);
                return created(rows[0]);
            }

            // PUT /admin/offers/:id
            if (method === 'PUT' && path.match(/^\/admin\/offers\/[\w-]+$/)) {
                const id = path.split('/')[3];
                const rows = await query(
                    'UPDATE offers SET code = COALESCE($1, code), description = COALESCE($2, description), type = COALESCE($3, type), value = COALESCE($4::NUMERIC, value), min_order = COALESCE($5::NUMERIC, min_order), max_uses = COALESCE($6, max_uses), is_active = COALESCE($7, is_active), expires_at = $8::TIMESTAMPTZ WHERE id = $9::uuid RETURNING *',
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

        return error(404, 'Not found');
    } catch (err) {
        console.error('API Error:', err);
        // Don't leak internal error details to clients
        return error(500, 'Internal server error');
    }
};
