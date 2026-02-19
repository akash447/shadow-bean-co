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
        if (typeof p === 'number') return { name: `p${i}`, value: { longValue: Math.floor(p) === p ? p : undefined, doubleValue: Math.floor(p) !== p ? p : undefined } };
        if (typeof p === 'boolean') return { name: `p${i}`, value: { booleanValue: p } };
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
    const body = event.body ? JSON.parse(event.body) : {};
    const qs = event.queryStringParameters || {};

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
            const rows = await query('SELECT * FROM products WHERE id = $1', [id]);
            return rows.length ? ok(rows[0]) : error(404, 'Product not found');
        }

        // GET /reviews
        if (method === 'GET' && path === '/reviews') {
            const limit = parseInt(qs.limit || '10', 10);
            const rows = await query('SELECT * FROM reviews WHERE is_approved = true ORDER BY rating DESC LIMIT $1', [limit]);
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
            const rows = await query('SELECT * FROM profiles WHERE id = $1 OR cognito_sub = $1', [id]);
            return ok(rows[0] || null);
        }

        // PUT /profiles/:id
        if (method === 'PUT' && path.match(/^\/profiles\/[\w-]+$/)) {
            const id = path.split('/')[2];
            const rows = await query(
                'UPDATE profiles SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), avatar_url = COALESCE($3, avatar_url) WHERE id = $4 OR cognito_sub = $4 RETURNING *',
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
                await query('DELETE FROM taste_profiles WHERE id = $1 AND user_id = $2::uuid', [id, profileId]);
            } else {
                await query('DELETE FROM taste_profiles WHERE id = $1', [id]);
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
            console.log('Creating order for user:', body.user_id, 'amount:', body.total_amount);
            const profileId = await resolveProfileId(body.user_id);
            console.log('Resolved profileId:', profileId);
            if (!profileId) return error(400, 'User profile not found. Please ensure your profile is set up.');

            const orderRows = await query(
                'INSERT INTO orders (user_id, status, total_amount, razorpay_payment_id, shipping_address) VALUES ($1::uuid, $2, $3, $4, $5::jsonb) RETURNING *',
                [profileId, 'pending', body.total_amount, body.razorpay_payment_id, JSON.stringify(body.shipping_address)]
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

        // POST /reviews
        if (method === 'POST' && path === '/reviews') {
            const profileId = await resolveProfileId(body.user_id);
            if (!profileId) return error(400, 'User profile not found');
            const rows = await query(
                'INSERT INTO reviews (user_id, order_id, rating, comment) VALUES ($1::uuid, $2::uuid, $3, $4) RETURNING *',
                [profileId, body.order_id, body.rating, body.comment]
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
                     WHERE o.id = $1`,
                    [id]
                );
                if (!orderRows.length) return error(404, 'Order not found');
                const order = orderRows[0];
                // Get order items
                const items = await query(
                    `SELECT oi.*, tp.name as profile_name
                     FROM order_items oi
                     LEFT JOIN taste_profiles tp ON oi.taste_profile_id = tp.id
                     WHERE oi.order_id = $1`,
                    [id]
                );
                order.items = items;
                return ok(order);
            }

            // PUT /admin/orders/:id/status
            if (method === 'PUT' && path.match(/^\/admin\/orders\/[\w-]+\/status$/)) {
                const id = path.split('/')[3];
                console.log('Updating order status:', id, '->', body.status);
                const rows = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [body.status, id]);
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
                    'UPDATE orders SET status = $1, cancellation_reason = $2, cancelled_at = NOW() WHERE id = $3 RETURNING *',
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
                    'UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), base_price = COALESCE($3, base_price), image_url = COALESCE($4, image_url), is_active = COALESCE($5, is_active) WHERE id = $6 RETURNING *',
                    [body.name, body.description, body.base_price, body.image_url, body.is_active, id]
                );
                return ok(rows[0]);
            }

            // DELETE /admin/products/:id
            if (method === 'DELETE' && path.match(/^\/admin\/products\/[\w-]+$/)) {
                const id = path.split('/')[3];
                await query('DELETE FROM products WHERE id = $1', [id]);
                return ok({ deleted: true });
            }

            // GET /admin/reviews
            if (method === 'GET' && path === '/admin/reviews') {
                const rows = await query('SELECT * FROM reviews ORDER BY created_at DESC');
                return ok(rows);
            }

            // DELETE /admin/reviews/:id
            if (method === 'DELETE' && path.match(/^\/admin\/reviews\/[\w-]+$/)) {
                const id = path.split('/')[3];
                await query('DELETE FROM reviews WHERE id = $1', [id]);
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
                    'UPDATE pricing SET name = COALESCE($1, name), base_price = COALESCE($2, base_price), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *',
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
                    'UPDATE admin_users SET is_active = COALESCE($1, is_active), role = COALESCE($2, role) WHERE id = $3 RETURNING *',
                    [body.is_active, body.role, id]
                );
                return ok(rows[0]);
            }

            // DELETE /admin/access/:id
            if (method === 'DELETE' && path.match(/^\/admin\/access\/[\w-]+$/)) {
                const id = path.split('/')[3];
                await query('DELETE FROM admin_users WHERE id = $1', [id]);
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
                    'INSERT INTO offers (code, description, type, value, min_order, max_uses, is_active, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                    [body.code?.toUpperCase(), body.description || '', body.type || 'percentage', body.value || 0, body.min_order || 0, body.max_uses || 0, body.is_active !== false, body.expires_at || null]
                );
                console.log('Offer created:', rows[0]?.id);
                return created(rows[0]);
            }

            // PUT /admin/offers/:id
            if (method === 'PUT' && path.match(/^\/admin\/offers\/[\w-]+$/)) {
                const id = path.split('/')[3];
                const rows = await query(
                    'UPDATE offers SET code = COALESCE($1, code), description = COALESCE($2, description), type = COALESCE($3, type), value = COALESCE($4, value), min_order = COALESCE($5, min_order), max_uses = COALESCE($6, max_uses), is_active = COALESCE($7, is_active), expires_at = $8 WHERE id = $9::uuid RETURNING *',
                    [body.code?.toUpperCase(), body.description, body.type, body.value, body.min_order, body.max_uses, body.is_active, body.expires_at || null, id]
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
                        expires_at TIMESTAMPTZ,
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
        return error(500, 'Internal server error');
    }
};
