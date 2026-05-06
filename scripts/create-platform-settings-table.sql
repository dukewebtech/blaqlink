-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percentage NUMERIC DEFAULT 10,
  minimum_withdrawal_amount NUMERIC DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if table is empty
INSERT INTO platform_settings (commission_percentage, minimum_withdrawal_amount)
SELECT 10, 5000
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read settings
CREATE POLICY "Admins can read platform settings"
ON platform_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_id = auth.uid()
    AND users.is_admin = true
  )
);

-- Create policy for admins to update settings
CREATE POLICY "Admins can update platform settings"
ON platform_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_id = auth.uid()
    AND users.is_admin = true
  )
);

-- Create policy for everyone to read settings (needed for withdrawal validation)
CREATE POLICY "Everyone can read platform settings"
ON platform_settings FOR SELECT
TO authenticated
USING (true);
