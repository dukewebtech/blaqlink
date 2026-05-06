-- Fix orders table RLS policies to use correct user_id reference
-- The orders.user_id references users.id (not auth.users.id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

-- Create policies that check against users table
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update own orders"
ON orders FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own orders"
ON orders FOR DELETE
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);
