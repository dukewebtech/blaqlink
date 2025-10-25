-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can update their own withdrawal requests" ON withdrawal_requests;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_user_id_from_auth();

-- Create a helper function to get user_id from auth_id
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Enable RLS on withdrawal_requests table
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own withdrawal requests
CREATE POLICY "Users can insert their own withdrawal requests"
ON withdrawal_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = get_user_id_from_auth());

-- Policy: Users can view their own withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests"
ON withdrawal_requests
FOR SELECT
TO authenticated
USING (user_id = get_user_id_from_auth());

-- Policy: Users can update their own withdrawal requests (only if status is pending)
CREATE POLICY "Users can update their own pending withdrawal requests"
ON withdrawal_requests
FOR UPDATE
TO authenticated
USING (user_id = get_user_id_from_auth() AND status = 'pending')
WITH CHECK (user_id = get_user_id_from_auth() AND status = 'pending');

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_from_auth() TO authenticated;
