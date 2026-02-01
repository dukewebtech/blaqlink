-- Fix RLS policies for products table to allow proper user access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
DROP POLICY IF EXISTS "Public can view published products" ON products;
DROP POLICY IF EXISTS "Service role can insert products" ON products;

-- Create new policies that work with the user_id column
-- The user_id in products table is the profile ID from users table

-- Allow users to view their own products
CREATE POLICY "Users can view their own products" ON products
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Allow users to insert their own products
CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Allow users to update their own products
CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Allow users to delete their own products
CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Allow public to view published products (for storefront)
CREATE POLICY "Public can view published products" ON products
  FOR SELECT
  USING (status = 'published');
