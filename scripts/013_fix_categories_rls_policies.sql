-- Fix categories table RLS policies to use correct user_id reference
-- The categories.user_id references users.id (not auth.users.id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Public can view active categories" ON categories;

-- Create policies that check against users table
CREATE POLICY "Users can view own categories"
ON categories FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own categories"
ON categories FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update own categories"
ON categories FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own categories"
ON categories FOR DELETE
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Allow public to view active categories (for storefront)
CREATE POLICY "Public can view active categories"
ON categories FOR SELECT
USING (status = 'active');
