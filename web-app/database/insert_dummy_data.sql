-- ============================================
-- SHADOW BEAN CO. - DUMMY TEST DATA
-- Run this in Supabase SQL Editor to test admin panel connectivity
-- ============================================

-- 1. CREATE PRODUCTS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 599,
    sizes TEXT[] DEFAULT ARRAY['250g', '500g', '1kg'],
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);

-- Allow authenticated users to manage products
DROP POLICY IF EXISTS "Allow authenticated manage products" ON products;
CREATE POLICY "Allow authenticated manage products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. CREATE APP_ASSETS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS app_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    type TEXT DEFAULT 'image',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for app_assets
ALTER TABLE app_assets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to app_assets
DROP POLICY IF EXISTS "Allow public read access to app_assets" ON app_assets;
CREATE POLICY "Allow public read access to app_assets" ON app_assets FOR SELECT USING (true);

-- Allow authenticated users to manage app_assets
DROP POLICY IF EXISTS "Allow authenticated manage app_assets" ON app_assets;
CREATE POLICY "Allow authenticated manage app_assets" ON app_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- INSERT DUMMY DATA
-- ============================================

-- Clear existing dummy data (to avoid duplicates on re-run)
DELETE FROM products WHERE name LIKE '%Test%' OR name LIKE '%Shadow Bean%';
DELETE FROM app_assets WHERE key LIKE 'test_%';

-- 3. INSERT DUMMY PRODUCTS
INSERT INTO products (name, description, base_price, sizes, image_url, is_active) VALUES
(
    'Shadow Bean Signature Blend',
    'Our flagship salt-air roasted coffee with zero bitterness. Shade-grown in the Western Ghats.',
    599,
    ARRAY['250g', '500g', '1kg'],
    'https://images.unsplash.com/photo-1559056199-641a0ac8b5e1?w=400',
    true
),
(
    'Midnight Roast Dark Blend',
    'Bold and intense dark roast for those who like it strong. Notes of dark chocolate and caramel.',
    699,
    ARRAY['250g', '500g'],
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
    true
),
(
    'Morning Mist Light Roast',
    'Delicate light roast with bright citrus notes. Perfect for pour-over brewing.',
    549,
    ARRAY['250g', '500g', '1kg'],
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    true
),
(
    'Test Inactive Product',
    'This product is inactive and should appear greyed out.',
    399,
    ARRAY['250g'],
    NULL,
    false
);

-- 4. INSERT DUMMY APP_ASSETS (for Media Gallery)
INSERT INTO app_assets (key, url, title, type) VALUES
(
    'test_hero_banner',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
    'Hero Banner - Coffee Beans',
    'image'
),
(
    'test_product_showcase',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
    'Product Showcase - Latte Art',
    'image'
),
(
    'test_about_background',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    'About Page Background',
    'image'
);

-- 5. INSERT DUMMY PROFILES (Users)
-- First check if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Clear any test profiles
        DELETE FROM profiles WHERE full_name LIKE '%Test%';
        
        -- Insert dummy profiles
        INSERT INTO profiles (id, full_name, email, phone, created_at) VALUES
        (gen_random_uuid(), 'John Doe (Test)', 'john.test@example.com', '+91 98765 43210', NOW() - INTERVAL '5 days'),
        (gen_random_uuid(), 'Jane Smith (Test)', 'jane.test@example.com', '+91 87654 32109', NOW() - INTERVAL '3 days'),
        (gen_random_uuid(), 'Rahul Kumar (Test)', 'rahul.test@example.com', '+91 76543 21098', NOW() - INTERVAL '1 day');
    END IF;
END $$;

-- 6. INSERT DUMMY ORDERS
DO $$
DECLARE
    user_id_1 UUID;
    user_id_2 UUID;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- Get some user IDs (or create dummy ones)
        SELECT id INTO user_id_1 FROM profiles WHERE full_name LIKE '%John%' LIMIT 1;
        SELECT id INTO user_id_2 FROM profiles WHERE full_name LIKE '%Jane%' LIMIT 1;
        
        -- If no users, use random UUIDs
        IF user_id_1 IS NULL THEN user_id_1 := gen_random_uuid(); END IF;
        IF user_id_2 IS NULL THEN user_id_2 := gen_random_uuid(); END IF;
        
        -- Clear test orders
        DELETE FROM orders WHERE id IN (
            SELECT id FROM orders WHERE total_amount IN (1598, 2499, 799)
        );
        
        -- Insert dummy orders
        INSERT INTO orders (user_id, status, total_amount, items, shipping_address, created_at) VALUES
        (
            user_id_1,
            'pending',
            1598,
            '[{"name": "Shadow Bean Signature Blend", "size": "500g", "quantity": 2, "price": 799}]'::jsonb,
            '{"line1": "123 Test Street", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}'::jsonb,
            NOW() - INTERVAL '2 hours'
        ),
        (
            user_id_1,
            'processing',
            2499,
            '[{"name": "Midnight Roast Dark Blend", "size": "1kg", "quantity": 1, "price": 1299}, {"name": "Morning Mist Light Roast", "size": "500g", "quantity": 2, "price": 600}]'::jsonb,
            '{"line1": "456 Coffee Lane", "city": "Bangalore", "state": "Karnataka", "pincode": "560001"}'::jsonb,
            NOW() - INTERVAL '1 day'
        ),
        (
            user_id_2,
            'delivered',
            799,
            '[{"name": "Shadow Bean Signature Blend", "size": "250g", "quantity": 1, "price": 599}]'::jsonb,
            '{"line1": "789 Bean Road", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600001"}'::jsonb,
            NOW() - INTERVAL '5 days'
        );
    END IF;
END $$;

-- 7. INSERT DUMMY REVIEWS
DO $$
DECLARE
    user_id_1 UUID;
    product_id_1 UUID;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        SELECT id INTO user_id_1 FROM profiles WHERE full_name LIKE '%Rahul%' LIMIT 1;
        SELECT id INTO product_id_1 FROM products WHERE name LIKE '%Signature%' LIMIT 1;
        
        IF user_id_1 IS NULL THEN user_id_1 := gen_random_uuid(); END IF;
        IF product_id_1 IS NULL THEN product_id_1 := gen_random_uuid(); END IF;
        
        -- Clear test reviews
        DELETE FROM reviews WHERE content LIKE '%Test review%';
        
        -- Insert dummy reviews
        INSERT INTO reviews (user_id, product_id, rating, content, created_at) VALUES
        (user_id_1, product_id_1, 5, 'Amazing coffee! The salt-air roasting really does eliminate bitterness. Test review for admin panel.', NOW() - INTERVAL '2 days'),
        (gen_random_uuid(), product_id_1, 4, 'Great flavour, smooth finish. Will order again. Test review #2.', NOW() - INTERVAL '4 days');
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES (Run these to check data)
-- ============================================

-- Check products
SELECT 'PRODUCTS' as table_name, COUNT(*) as count FROM products;

-- Check app_assets
SELECT 'APP_ASSETS' as table_name, COUNT(*) as count FROM app_assets;

-- Check profiles (if exists)
SELECT 'PROFILES' as table_name, COUNT(*) as count FROM profiles;

-- Check orders (if exists)
SELECT 'ORDERS' as table_name, COUNT(*) as count FROM orders;

-- Check reviews (if exists)
SELECT 'REVIEWS' as table_name, COUNT(*) as count FROM reviews;
