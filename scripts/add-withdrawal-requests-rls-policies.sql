-- Add Row Level Security policies for withdrawal_requests table

-- Enable RLS on the table (if not already enabled)
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own withdrawal requests
CREATE POLICY "Users can create their own withdrawal requests"
ON withdrawal_requests
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Policy: Users can view their own withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests"
ON withdrawal_requests
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Policy: Users can update their own pending withdrawal requests
CREATE POLICY "Users can update their own pending withdrawal requests"
ON withdrawal_requests
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
  AND status = 'pending'
)
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
  AND status = 'pending'
);
