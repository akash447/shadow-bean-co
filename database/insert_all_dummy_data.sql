-- ============================================
-- SHADOW BEAN CO. - COMPLETE DUMMY DATA
-- For testing Admin Panel connectivity
-- ============================================

-- First, add public read policies for admin panel to work
-- (Admin panel needs to read all data)

-- 1. PROFILES - Add public read policy
DROP POLICY IF EXISTS "Allow public read for admin" ON profiles;
CREATE POLICY "Allow public read for admin" ON profiles FOR SELECT USING (true);

-- 2. ORDERS - Add public read policy  
DROP POLICY IF EXISTS "Allow public read for admin" ON orders;
CREATE POLICY "Allow public read for admin" ON orders FOR SELECT USING (true);

-- 3. REVIEWS - Already has public read

-- 4. PRICING - Add public read policy
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read for admin" ON pricing;
CREATE POLICY "Allow public read for admin" ON pricing FOR SELECT USING (true);

-- ============================================
-- INSERT DUMMY PROFILES (Users)
-- Note: We'll insert with fake UUIDs since these are test data
-- ============================================

-- First, temporarily disable the foreign key to auth.users
-- We'll create profiles without actual auth users for testing
-- This works because profiles only references auth.users, not enforced strictly in test mode

-- Create a separate test_profiles table for testing (no FK constraint)
CREATE TABLE IF NOT EXISTS test_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE test_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read test_profiles" ON test_profiles;
CREATE POLICY "Allow public read test_profiles" ON test_profiles FOR SELECT USING (true);

-- Insert dummy users into test_profiles
DELETE FROM test_profiles;
INSERT INTO test_profiles (id, email, full_name, phone, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', '+91 98765 43210', NOW() - INTERVAL '10 days'),
('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane Smith', '+91 87654 32109', NOW() - INTERVAL '7 days'),
('33333333-3333-3333-3333-333333333333', 'rahul.kumar@example.com', 'Rahul Kumar', '+91 76543 21098', NOW() - INTERVAL '3 days'),
('44444444-4444-4444-4444-444444444444', 'priya.patel@example.com', 'Priya Patel', '+91 65432 10987', NOW() - INTERVAL '1 day');

-- ============================================
-- INSERT DUMMY ORDERS
-- ============================================

-- Create test_orders table (no FK constraint for testing)
CREATE TABLE IF NOT EXISTS test_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    items JSONB,
    shipping_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE test_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read test_orders" ON test_orders;
CREATE POLICY "Allow public read test_orders" ON test_orders FOR SELECT USING (true);

DELETE FROM test_orders;
INSERT INTO test_orders (user_id, user_name, user_email, status, total_amount, items, shipping_address, created_at) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'John Doe',
    'john.doe@example.com',
    'pending',
    1598.00,
    '[{"name": "Shadow Bean Signature Blend", "size": "500g", "quantity": 2, "price": 799}]'::jsonb,
    '{"name": "John Doe", "line1": "123 MG Road", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}'::jsonb,
    NOW() - INTERVAL '2 hours'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Jane Smith',
    'jane.smith@example.com',
    'processing',
    2099.00,
    '[{"name": "Midnight Roast Dark Blend", "size": "1kg", "quantity": 1, "price": 1399}, {"name": "Morning Mist Light Roast", "size": "250g", "quantity": 1, "price": 549}]'::jsonb,
    '{"name": "Jane Smith", "line1": "456 Brigade Road", "city": "Bangalore", "state": "Karnataka", "pincode": "560001"}'::jsonb,
    NOW() - INTERVAL '1 day'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Rahul Kumar',
    'rahul.kumar@example.com',
    'shipped',
    599.00,
    '[{"name": "Shadow Bean Signature Blend", "size": "250g", "quantity": 1, "price": 599}]'::jsonb,
    '{"name": "Rahul Kumar", "line1": "789 Anna Nagar", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600001"}'::jsonb,
    NOW() - INTERVAL '3 days'
),
(
    '44444444-4444-4444-4444-444444444444',
    'Priya Patel',
    'priya.patel@example.com',
    'delivered',
    1798.00,
    '[{"name": "Morning Mist Light Roast", "size": "1kg", "quantity": 2, "price": 899}]'::jsonb,
    '{"name": "Priya Patel", "line1": "101 CG Road", "city": "Ahmedabad", "state": "Gujarat", "pincode": "380001"}'::jsonb,
    NOW() - INTERVAL '7 days'
);

-- ============================================
-- INSERT DUMMY REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS test_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT,
    product_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE test_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read test_reviews" ON test_reviews;
CREATE POLICY "Allow public read test_reviews" ON test_reviews FOR SELECT USING (true);

DELETE FROM test_reviews;
INSERT INTO test_reviews (user_id, user_name, product_name, rating, comment, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'John Doe', 'Shadow Bean Signature Blend', 5, 'Absolutely love this coffee! The salt-air roasting really makes a difference. Zero bitterness!', NOW() - INTERVAL '2 days'),
('22222222-2222-2222-2222-222222222222', 'Jane Smith', 'Midnight Roast Dark Blend', 4, 'Great dark roast, bold flavor. Would order again.', NOW() - INTERVAL '4 days'),
('33333333-3333-3333-3333-333333333333', 'Rahul Kumar', 'Morning Mist Light Roast', 5, 'Perfect for my morning pour-over. Light and citrusy!', NOW() - INTERVAL '5 days'),
('44444444-4444-4444-4444-444444444444', 'Priya Patel', 'Shadow Bean Signature Blend', 4, 'Smooth taste, exactly as described. Packaging was excellent.', NOW() - INTERVAL '8 days');

-- ============================================
-- INSERT/UPDATE PRICING
-- ============================================

DELETE FROM pricing;
INSERT INTO pricing (base_price, discount_percentage, discount_code, is_active, created_at) VALUES
(599.00, 0, NULL, true, NOW() - INTERVAL '30 days'),
(549.00, 10, 'WELCOME10', true, NOW() - INTERVAL '15 days'),
(499.00, 20, 'FESTIVE20', false, NOW() - INTERVAL '7 days');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

SELECT 'test_profiles' as table_name, COUNT(*) as count FROM test_profiles
UNION ALL SELECT 'test_orders', COUNT(*) FROM test_orders
UNION ALL SELECT 'test_reviews', COUNT(*) FROM test_reviews
UNION ALL SELECT 'pricing', COUNT(*) FROM pricing
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'app_assets', COUNT(*) FROM app_assets;
