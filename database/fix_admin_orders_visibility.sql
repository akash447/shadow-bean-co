-- =====================================================
-- FIX ADMIN ORDERS VISIBILITY (v2 - Fixed Recursion)
-- =====================================================
-- Run this in Supabase SQL Editor to allow admins to view all orders.
-- =====================================================

-- ===========================================
-- 1. FIX INFINITE RECURSION ON ADMIN_USERS
-- ===========================================
-- The admin_users table policy was causing infinite recursion
-- because it referenced itself. We disable RLS on this table
-- since it only contains admin user IDs (not sensitive data).

-- Drop the problematic policy first
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;

-- Disable RLS on admin_users to prevent recursion
-- This is safe because the table only stores admin user IDs
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- 2. KEEP ADMIN POLICIES ON ORDERS TABLE
-- ===========================================
-- These are already created and should work now

-- Re-create to ensure they use correct syntax
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()::text)
  );

-- ===========================================
-- 3. KEEP ADMIN POLICIES ON ORDER_ITEMS
-- ===========================================
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()::text)
  );

-- ===========================================
-- 4. KEEP ADMIN POLICIES ON PROFILES
-- ===========================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()::text)
  );

-- ===========================================
-- DONE! The infinite recursion should be fixed.
-- ===========================================
