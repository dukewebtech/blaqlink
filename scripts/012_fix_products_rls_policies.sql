-- Fix products table RLS policies to use correct user_id reference
-- The products.user_id references users.id (not auth.users.id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;
DROP POLICY IF EXISTS "Public can view published products" ON products;

-- Create policies that check against users table
CREATE POLICY "Users can view own products"
ON products FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own products"
ON products FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update own products"
ON products FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own products"
ON products FOR DELETE
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Allow public to view published products (for storefront)
CREATE POLICY "Public can view published products"
ON products FOR SELECT
USING (status = 'published');
