-- =====================================================
-- FIX ADMIN ORDERS VISIBILITY
-- =====================================================
-- Run this in Supabase SQL Editor to allow admins to view all orders.
-- The admin_users table must exist with the admin user_id.
-- =====================================================

-- ===========================================
-- 1. ADD ADMIN_USERS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can see the admin_users table
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- ===========================================
-- 2. ADD ADMIN POLICIES TO ORDERS TABLE
-- ===========================================

-- Admins can view ALL orders
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Admins can update ALL orders (for status changes)
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- ===========================================
-- 3. ADD ADMIN POLICIES TO ORDER_ITEMS TABLE
-- ===========================================

-- Admins can view ALL order items
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- ===========================================
-- 4. ADD ADMIN POLICIES TO PROFILES TABLE
-- ===========================================

-- Admins can view ALL profiles (to see customer names)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- ===========================================
-- 5. VERIFICATION: Check your admin user exists
-- ===========================================
-- After running this, you need to add yourself to admin_users:
-- 
-- INSERT INTO admin_users (user_id)
-- SELECT id FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL@example.com';
--
-- Or check existing admins:
-- SELECT * FROM admin_users;
-- ===========================================
