-- Unblock Admin Features (Permissive Policies)
-- This script allows public access to necessary tables to rule out auth issues.

-- 1. Storage Objects (Media Bucket) - Allow PUBLIC insert/update/delete
DROP POLICY IF EXISTS "Allow authenticated insert media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete media" ON storage.objects;

-- Create permissive policies (WARNING: This allows anyone to upload if they have the Anon key)
CREATE POLICY "Allow public insert media" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'media');
CREATE POLICY "Allow public select media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "Allow public update media" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'media');
CREATE POLICY "Allow public delete media" ON storage.objects FOR DELETE TO public USING (bucket_id = 'media');

-- 2. App Assets Table - Allow PUBLIC insert/update/delete
DROP POLICY IF EXISTS "Allow authenticated insert on app_assets" ON app_assets;
DROP POLICY IF EXISTS "Allow authenticated update on app_assets" ON app_assets;
DROP POLICY IF EXISTS "Allow authenticated delete on app_assets" ON app_assets;

CREATE POLICY "Allow public insert on app_assets" ON app_assets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on app_assets" ON app_assets FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on app_assets" ON app_assets FOR DELETE TO public USING (true);

-- 3. Test Orders Table - Allow PUBLIC update (for cancellation)
DROP POLICY IF EXISTS "Allow authenticated update on test_orders" ON test_orders;

CREATE POLICY "Allow public update on test_orders" ON test_orders FOR UPDATE TO public USING (true);


-- 4. Re-verify Columns for Cancellation (Just in case)
ALTER TABLE test_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE test_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
