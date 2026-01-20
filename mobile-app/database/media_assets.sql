-- Media Assets Table for CMS
-- Run this in Supabase SQL Editor

-- Create media_assets table
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  asset_type TEXT CHECK (asset_type IN ('hero', 'product', 'story', 'about', 'banner', 'icon', 'other')) DEFAULT 'other',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default media assets with keys that app uses
INSERT INTO public.media_assets (title, key, url, asset_type, description) VALUES
  ('Hero Banner', 'hero_banner', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/hero_banner.png', 'hero', 'Main hero banner on home page'),
  ('Product Bag', 'product_bag', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/product_bag.png', 'product', 'Coffee product bag image'),
  ('Coffee Farm', 'coffee_farm', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/coffee_farm.png', 'story', 'Coffee farm image for about section'),
  ('Farmer Harvesting', 'farmer_harvesting', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/farmer_harvesting.jpg', 'story', 'Farmer harvesting coffee beans'),
  ('Latte Art', 'latte_art', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/latte_art.png', 'other', 'Latte art image'),
  ('Coffee Cherries', 'coffee_cherries', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/coffee_cherries.jpg', 'about', 'Coffee cherries on branch'),
  ('Roasting Process', 'roasting_process', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/roasting_process.jpg', 'about', 'Coffee roasting process'),
  ('Journey Map', 'journey_map', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/journey_map.png', 'about', 'Coffee journey map'),
  ('Shop Hero', 'shop_hero', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/shop_hero.png', 'banner', 'Shop page hero banner'),
  ('Pour Over Kit', 'pour_over_kit', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/pour_over_kit.png', 'icon', 'Pour over kit icon'),
  ('French Press', 'french_press', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/french_press.png', 'icon', 'French press icon'),
  ('App Logo', 'app_logo', 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/logo.png', 'icon', 'App logo')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view media" ON media_assets
  FOR SELECT USING (true);

-- Allow admin to manage media (you can restrict this further)
CREATE POLICY "Admins can manage media" ON media_assets
  FOR ALL USING (true);
