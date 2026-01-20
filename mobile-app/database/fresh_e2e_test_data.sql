-- ============================================
-- SHADOW BEAN CO. - FRESH E2E TEST DATA
-- Clears all existing data and creates 10 linked profiles
-- ============================================

-- STEP 1: CLEAR ALL EXISTING DUMMY DATA
-- ============================================

-- Clear test tables
DELETE FROM test_reviews;
DELETE FROM test_orders;
DELETE FROM test_profiles;

-- Clear main tables (if data exists)
DELETE FROM products WHERE name LIKE '%Shadow Bean%' OR name LIKE '%Midnight%' OR name LIKE '%Morning%';
DELETE FROM app_assets WHERE key LIKE 'test_%';
DELETE FROM pricing;

-- STEP 2: CREATE 10 CUSTOMER PROFILES
-- ============================================

INSERT INTO test_profiles (id, email, full_name, phone, created_at) VALUES
('00000001-0001-0001-0001-000000000001', 'arjun.sharma@email.com', 'Arjun Sharma', '+91 98765 00001', NOW() - INTERVAL '30 days'),
('00000002-0002-0002-0002-000000000002', 'priya.mehta@email.com', 'Priya Mehta', '+91 98765 00002', NOW() - INTERVAL '28 days'),
('00000003-0003-0003-0003-000000000003', 'vikram.singh@email.com', 'Vikram Singh', '+91 98765 00003', NOW() - INTERVAL '25 days'),
('00000004-0004-0004-0004-000000000004', 'ananya.reddy@email.com', 'Ananya Reddy', '+91 98765 00004', NOW() - INTERVAL '22 days'),
('00000005-0005-0005-0005-000000000005', 'rahul.gupta@email.com', 'Rahul Gupta', '+91 98765 00005', NOW() - INTERVAL '20 days'),
('00000006-0006-0006-0006-000000000006', 'sneha.patel@email.com', 'Sneha Patel', '+91 98765 00006', NOW() - INTERVAL '18 days'),
('00000007-0007-0007-0007-000000000007', 'karthik.nair@email.com', 'Karthik Nair', '+91 98765 00007', NOW() - INTERVAL '15 days'),
('00000008-0008-0008-0008-000000000008', 'divya.iyer@email.com', 'Divya Iyer', '+91 98765 00008', NOW() - INTERVAL '12 days'),
('00000009-0009-0009-0009-000000000009', 'amit.kumar@email.com', 'Amit Kumar', '+91 98765 00009', NOW() - INTERVAL '7 days'),
('00000010-0010-0010-0010-000000000010', 'neha.joshi@email.com', 'Neha Joshi', '+91 98765 00010', NOW() - INTERVAL '3 days');

-- STEP 3: CREATE PRODUCTS (Coffee Blends)
-- ============================================

INSERT INTO products (id, name, description, base_price, sizes, image_url, is_active) VALUES
('a0000001-0001-0001-0001-000000000001', 'Shadow Bean Signature Blend', 'Our flagship salt-air roasted coffee with zero bitterness. Shade-grown in the Western Ghats with notes of dark chocolate and honey.', 599, ARRAY['250g', '500g', '1kg'], 'https://images.unsplash.com/photo-1559056199-641a0ac8b5e1?w=400', true),
('a0000002-0002-0002-0002-000000000002', 'Midnight Roast Dark Blend', 'Bold and intense dark roast for those who like it strong. Notes of dark chocolate, caramel, and toasted nuts.', 699, ARRAY['250g', '500g'], 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', true),
('a0000003-0003-0003-0003-000000000003', 'Morning Mist Light Roast', 'Delicate light roast with bright citrus notes. Perfect for pour-over brewing. Hints of berries and floral aroma.', 549, ARRAY['250g', '500g', '1kg'], 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', true);

-- STEP 4: CREATE CUSTOM ROAST ORDERS (Taste Profiles)
-- Each order represents a custom roast preference
-- ============================================

INSERT INTO test_orders (id, user_id, user_name, user_email, status, total_amount, items, shipping_address, created_at) VALUES
-- Arjun's Custom Roast Order (Medium, balanced)
('b0000001-0001-0001-0001-000000000001', '00000001-0001-0001-0001-000000000001', 'Arjun Sharma', 'arjun.sharma@email.com', 'delivered', 1198.00,
 '[{"name": "Custom Roast - Balanced Medium", "taste_profile": {"bitterness": 2, "acidity": 3, "body": 4, "flavour": 5, "roast_level": "Medium", "grind_type": "Whole Bean"}, "size": "500g", "quantity": 2, "price": 599}]'::jsonb,
 '{"name": "Arjun Sharma", "line1": "42 Koramangala 4th Block", "city": "Bangalore", "state": "Karnataka", "pincode": "560034"}'::jsonb,
 NOW() - INTERVAL '28 days'),

-- Priya's Order (Light, fruity)
('b0000002-0002-0002-0002-000000000002', '00000002-0002-0002-0002-000000000002', 'Priya Mehta', 'priya.mehta@email.com', 'delivered', 1647.00,
 '[{"name": "Custom Roast - Light Fruity", "taste_profile": {"bitterness": 1, "acidity": 4, "body": 2, "flavour": 5, "roast_level": "Light", "grind_type": "Pour Over"}, "size": "1kg", "quantity": 1, "price": 1099}, {"name": "Morning Mist Light Roast", "size": "250g", "quantity": 1, "price": 549}]'::jsonb,
 '{"name": "Priya Mehta", "line1": "15 Bandra West", "city": "Mumbai", "state": "Maharashtra", "pincode": "400050"}'::jsonb,
 NOW() - INTERVAL '25 days'),

-- Vikram's Order (Dark, strong)
('b0000003-0003-0003-0003-000000000003', '00000003-0003-0003-0003-000000000003', 'Vikram Singh', 'vikram.singh@email.com', 'shipped', 1399.00,
 '[{"name": "Midnight Roast Dark Blend", "size": "1kg", "quantity": 2, "price": 699}]'::jsonb,
 '{"name": "Vikram Singh", "line1": "78 Connaught Place", "city": "New Delhi", "state": "Delhi", "pincode": "110001"}'::jsonb,
 NOW() - INTERVAL '10 days'),

-- Ananya's Custom Order (Espresso grind)
('b0000004-0004-0004-0004-000000000004', '00000004-0004-0004-0004-000000000004', 'Ananya Reddy', 'ananya.reddy@email.com', 'processing', 799.00,
 '[{"name": "Custom Roast - Espresso Bold", "taste_profile": {"bitterness": 3, "acidity": 2, "body": 5, "flavour": 4, "roast_level": "Balanced", "grind_type": "Espresso"}, "size": "500g", "quantity": 1, "price": 799}]'::jsonb,
 '{"name": "Ananya Reddy", "line1": "22 Jubilee Hills", "city": "Hyderabad", "state": "Telangana", "pincode": "500033"}'::jsonb,
 NOW() - INTERVAL '5 days'),

-- Rahul's Order (pending)
('b0000005-0005-0005-0005-000000000005', '00000005-0005-0005-0005-000000000005', 'Rahul Gupta', 'rahul.gupta@email.com', 'pending', 599.00,
 '[{"name": "Shadow Bean Signature Blend", "size": "250g", "quantity": 1, "price": 599}]'::jsonb,
 '{"name": "Rahul Gupta", "line1": "56 MG Road", "city": "Pune", "state": "Maharashtra", "pincode": "411001"}'::jsonb,
 NOW() - INTERVAL '2 days'),

-- Sneha's Order (French Press grind)
('b0000006-0006-0006-0006-000000000006', '00000006-0006-0006-0006-000000000006', 'Sneha Patel', 'sneha.patel@email.com', 'pending', 1198.00,
 '[{"name": "Custom Roast - French Press Smooth", "taste_profile": {"bitterness": 2, "acidity": 2, "body": 4, "flavour": 4, "roast_level": "Medium", "grind_type": "French Press"}, "size": "500g", "quantity": 2, "price": 599}]'::jsonb,
 '{"name": "Sneha Patel", "line1": "34 CG Road", "city": "Ahmedabad", "state": "Gujarat", "pincode": "380009"}'::jsonb,
 NOW() - INTERVAL '1 day'),

-- Karthik's Order (Moka Pot)
('b0000007-0007-0007-0007-000000000007', '00000007-0007-0007-0007-000000000007', 'Karthik Nair', 'karthik.nair@email.com', 'delivered', 2196.00,
 '[{"name": "Custom Roast - Moka Intense", "taste_profile": {"bitterness": 4, "acidity": 2, "body": 5, "flavour": 3, "roast_level": "Balanced", "grind_type": "Moka Pot"}, "size": "1kg", "quantity": 2, "price": 1099}]'::jsonb,
 '{"name": "Karthik Nair", "line1": "89 MG Road", "city": "Kochi", "state": "Kerala", "pincode": "682016"}'::jsonb,
 NOW() - INTERVAL '20 days'),

-- Divya's Order (Filter coffee)
('b0000008-0008-0008-0008-000000000008', '00000008-0008-0008-0008-000000000008', 'Divya Iyer', 'divya.iyer@email.com', 'confirmed', 849.00,
 '[{"name": "Custom Roast - South Indian Filter", "taste_profile": {"bitterness": 3, "acidity": 1, "body": 5, "flavour": 4, "roast_level": "Balanced", "grind_type": "Filter"}, "size": "500g", "quantity": 1, "price": 849}]'::jsonb,
 '{"name": "Divya Iyer", "line1": "12 T Nagar", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600017"}'::jsonb,
 NOW() - INTERVAL '3 days'),

-- Amit's Large Order
('b0000009-0009-0009-0009-000000000009', '00000009-0009-0009-0009-000000000009', 'Amit Kumar', 'amit.kumar@email.com', 'shipped', 3297.00,
 '[{"name": "Shadow Bean Signature Blend", "size": "1kg", "quantity": 2, "price": 1099}, {"name": "Midnight Roast Dark Blend", "size": "1kg", "quantity": 1, "price": 1099}]'::jsonb,
 '{"name": "Amit Kumar", "line1": "67 Salt Lake", "city": "Kolkata", "state": "West Bengal", "pincode": "700091"}'::jsonb,
 NOW() - INTERVAL '8 days'),

-- Neha's First Order
('b0000010-0010-0010-0010-000000000010', '00000010-0010-0010-0010-000000000010', 'Neha Joshi', 'neha.joshi@email.com', 'pending', 549.00,
 '[{"name": "Morning Mist Light Roast", "size": "250g", "quantity": 1, "price": 549}]'::jsonb,
 '{"name": "Neha Joshi", "line1": "23 MI Road", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001"}'::jsonb,
 NOW() - INTERVAL '1 day');

-- STEP 5: CREATE REVIEWS (Linked to customers who have delivered orders)
-- ============================================

INSERT INTO test_reviews (id, user_id, user_name, product_name, rating, comment, created_at) VALUES
-- Arjun's review
('c0000001-0001-0001-0001-000000000001', '00000001-0001-0001-0001-000000000001', 'Arjun Sharma', 'Custom Roast - Balanced Medium', 5, 
 'Absolutely incredible! The custom roast recommendation was spot-on. Zero bitterness, just pure smooth coffee flavor. My morning ritual is now something I look forward to!', 
 NOW() - INTERVAL '26 days'),

-- Priya's review
('c0000002-0002-0002-0002-000000000002', '00000002-0002-0002-0002-000000000002', 'Priya Mehta', 'Morning Mist Light Roast', 5, 
 'The light roast is exactly what I was looking for. Beautiful citrus notes and perfect for my pour-over. The packaging was also eco-friendly which I appreciate!', 
 NOW() - INTERVAL '23 days'),

-- Vikram's review (for a previous order, 4 stars)
('c0000003-0003-0003-0003-000000000003', '00000003-0003-0003-0003-000000000003', 'Vikram Singh', 'Midnight Roast Dark Blend', 4, 
 'Strong and bold, just how I like it. The dark chocolate notes are prominent. Would have given 5 stars but delivery took a bit longer than expected.', 
 NOW() - INTERVAL '14 days'),

-- Karthik's review (very happy customer)
('c0000004-0004-0004-0004-000000000004', '00000007-0007-0007-0007-000000000007', 'Karthik Nair', 'Custom Roast - Moka Intense', 5, 
 'Perfect for my Moka pot! The grind size is exactly right and the intensity is amazing. Have already recommended to all my friends.', 
 NOW() - INTERVAL '18 days'),

-- Second review from Arjun (repeat customer)
('c0000005-0005-0005-0005-000000000005', '00000001-0001-0001-0001-000000000001', 'Arjun Sharma', 'Shadow Bean Signature Blend', 5, 
 'Tried the signature blend after my custom roast and I am hooked! The salt-air roasting really makes a difference. This is now my go-to coffee.', 
 NOW() - INTERVAL '15 days'),

-- Priya's second review
('c0000006-0006-0006-0006-000000000006', '00000002-0002-0002-0002-000000000002', 'Priya Mehta', 'Custom Roast - Light Fruity', 5, 
 'The fruity notes are divine! Perfect acidity balance. Best light roast I have ever had. The freshness is unmatched.', 
 NOW() - INTERVAL '20 days'),

-- A 3-star review (constructive feedback)
('c0000007-0007-0007-0007-000000000007', '00000005-0005-0005-0005-000000000005', 'Rahul Gupta', 'Shadow Bean Signature Blend', 3, 
 'Good coffee but expected a bit more from the signature blend. Maybe my taste preference is different. Will try the darker roasts next time.', 
 NOW() - INTERVAL '10 days'),

-- Divya's review (pending delivery but reviewed sample)
('c0000008-0008-0008-0008-000000000008', '00000008-0008-0008-0008-000000000008', 'Divya Iyer', 'Shadow Bean Signature Blend', 4, 
 'Received a sample with my order - great quality! The main order is on the way. Excited to try my custom filter grind!', 
 NOW() - INTERVAL '2 days');

-- STEP 6: UPDATE PRICING
-- ============================================

INSERT INTO pricing (base_price, discount_percentage, discount_code, is_active, created_at) VALUES
(599.00, 0, NULL, true, NOW() - INTERVAL '60 days'),
(549.00, 10, 'WELCOME10', true, NOW() - INTERVAL '30 days'),
(479.00, 20, 'LOYALTY20', false, NOW() - INTERVAL '15 days');

-- STEP 7: ADD MEDIA ASSETS
-- ============================================

INSERT INTO app_assets (key, url, title, type) VALUES
('home_hero_banner', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800', 'Home Page Hero - Fresh Coffee Beans', 'image'),
('product_showcase', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800', 'Product Showcase - Latte Art', 'image'),
('about_roasting', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', 'About - Coffee Roasting Process', 'image'),
('brewing_guide', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', 'Brewing Guide - Pour Over', 'image');

-- STEP 8: VERIFICATION QUERIES
-- ============================================

SELECT '=== DATA SUMMARY ===' as info;

SELECT 'test_profiles' as table_name, COUNT(*) as count FROM test_profiles
UNION ALL SELECT 'test_orders', COUNT(*) FROM test_orders
UNION ALL SELECT 'test_reviews', COUNT(*) FROM test_reviews
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'app_assets', COUNT(*) FROM app_assets
UNION ALL SELECT 'pricing', COUNT(*) FROM pricing;

SELECT '=== ORDER STATUS BREAKDOWN ===' as info;
SELECT status, COUNT(*) as count FROM test_orders GROUP BY status ORDER BY count DESC;

SELECT '=== AVERAGE RATING ===' as info;
SELECT ROUND(AVG(rating)::numeric, 2) as avg_rating, COUNT(*) as total_reviews FROM test_reviews;

SELECT '=== TOTAL REVENUE ===' as info;
SELECT ROUND(SUM(total_amount)::numeric, 2) as total_revenue FROM test_orders;
