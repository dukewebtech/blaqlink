-- Allow public (unauthenticated) access to store info fields
-- This is needed for the public storefront to display store information
-- without requiring authentication.

CREATE POLICY IF NOT EXISTS "Public can view store info"
  ON users FOR SELECT
  USING (true);
