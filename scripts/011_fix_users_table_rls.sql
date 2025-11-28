-- Fix users table to use auth_id instead of id for RLS policies
-- The users table has both id (UUID) and auth_id (references auth.users)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;

-- Create new policies using auth_id
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can delete their own profile"
  ON users FOR DELETE
  USING (auth.uid() = auth_id);
