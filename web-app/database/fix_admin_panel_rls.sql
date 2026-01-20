-- Fix Admin Panel Functionality
-- Run this in Supabase SQL Editor to fix upload and order cancellation

---------------------------------------------------
-- 1. FIX STORAGE BUCKET RLS FOR MEDIA UPLOADS
---------------------------------------------------

-- First, check if bucket exists, if not create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to media bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'media');

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access for media" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'media');

-- Allow authenticated users to update/replace their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can update media" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'media');

-- Allow authenticated users to delete media
CREATE POLICY IF NOT EXISTS "Authenticated users can delete media" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'media');

---------------------------------------------------
-- 2. FIX APP_ASSETS TABLE RLS
---------------------------------------------------

-- Enable RLS on app_assets if not already enabled
ALTER TABLE app_assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate cleanly)
DROP POLICY IF EXISTS "Allow public read on app_assets" ON app_assets;
DROP POLICY IF EXISTS "Allow authenticated insert on app_assets" ON app_assets;
DROP POLICY IF EXISTS "Allow authenticated update on app_assets" ON app_assets;
DROP POLICY IF EXISTS "Allow authenticated delete on app_assets" ON app_assets;

-- Create policies for app_assets
CREATE POLICY "Allow public read on app_assets" 
ON app_assets FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow authenticated insert on app_assets" 
ON app_assets FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on app_assets" 
ON app_assets FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated delete on app_assets" 
ON app_assets FOR DELETE 
TO authenticated 
USING (true);

---------------------------------------------------
-- 3. ADD MISSING COLUMNS TO TEST_ORDERS FOR CANCELLATION
---------------------------------------------------

-- Add cancellation columns if they don't exist
ALTER TABLE test_orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

ALTER TABLE test_orders 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

---------------------------------------------------
-- 4. FIX TEST_ORDERS RLS FOR UPDATE
---------------------------------------------------

-- Enable RLS
ALTER TABLE test_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read on test_orders" ON test_orders;
DROP POLICY IF EXISTS "Allow authenticated update on test_orders" ON test_orders;

-- Create policies
CREATE POLICY "Allow public read on test_orders" 
ON test_orders FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow authenticated update on test_orders" 
ON test_orders FOR UPDATE 
TO authenticated 
USING (true);

---------------------------------------------------
-- Done! Admin panel should now work properly.
---------------------------------------------------
