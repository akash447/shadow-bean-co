-- ============================================
-- SHADOW BEAN CO - IMAGE ASSETS MIGRATION
-- Upload all app images to Supabase for central management
-- ============================================

-- Step 1: Add category column to app_assets if not exists
ALTER TABLE app_assets ADD COLUMN IF NOT EXISTS category TEXT;

-- Step 2: Clear existing app images (keep test data)
DELETE FROM app_assets WHERE category IS NOT NULL;

-- Step 3: Insert all app images
-- Note: For now using placeholder Unsplash URLs
-- You should upload actual images to Supabase Storage and update URLs

INSERT INTO app_assets (key, url, title, type, category) VALUES
-- Brand/Logo
('logo_bird', 'https://images.unsplash.com/photo-1559056199-641a0ac8b5e1?w=400&h=400&fit=crop', 'Shadow Bean Logo', 'image', 'brand'),

-- Products
('product_bag', 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400&h=500&fit=crop', 'Coffee Bag Product', 'image', 'product'),

-- Hero/Background Images
('coffee_farm', 'https://images.unsplash.com/photo-1524350876685-274059332603?w=800&h=600&fit=crop', 'Coffee Farm Background', 'image', 'hero'),
('coffee_cherries', 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=800&h=600&fit=crop', 'Coffee Cherries', 'image', 'hero'),
('roasting_process', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&h=600&fit=crop', 'Roasting Process', 'image', 'hero'),
('pour_over_brewing', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', 'Pour Over Brewing', 'image', 'hero'),
('coffee_farmer', 'https://images.unsplash.com/photo-1511081692775-05d0f180a065?w=800&h=600&fit=crop', 'Coffee Farmer', 'image', 'hero'),

-- Feature Icons (using smaller images)
('icon_shade_grown', 'https://images.unsplash.com/photo-1524350876685-274059332603?w=100&h=100&fit=crop', 'Shade Grown Icon', 'image', 'icon'),
('icon_salt_roasted', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&h=100&fit=crop', 'Salt Roasted Icon', 'image', 'icon'),
('icon_small_batch', 'https://images.unsplash.com/photo-1559056199-641a0ac8b5e1?w=100&h=100&fit=crop', 'Small Batch Icon', 'image', 'icon'),
('icon_personalised', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=100&h=100&fit=crop', 'Personalised Icon', 'image', 'icon'),

-- Brewing Method Icons
('icon_pour_over', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&h=100&fit=crop', 'Pour Over Icon', 'image', 'brewing'),
('icon_french_press', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=100&h=100&fit=crop', 'French Press Icon', 'image', 'brewing'),
('icon_chhani', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop', 'Chhani Filter Icon', 'image', 'brewing');

-- Step 4: Add RLS policy if not exists
DROP POLICY IF EXISTS "Allow public read app_assets with category" ON app_assets;
CREATE POLICY "Allow public read app_assets with category" ON app_assets FOR SELECT USING (true);

-- Step 5: Verify
SELECT category, COUNT(*) as count FROM app_assets WHERE category IS NOT NULL GROUP BY category ORDER BY category;
SELECT key, title, category FROM app_assets WHERE category IS NOT NULL ORDER BY category, key;
