-- ============================================
-- Platform Settings Table Setup
-- ============================================
-- This script creates the platform_settings table with default values
-- Run this script in your Supabase SQL Editor to enable platform settings
-- 
-- Default Values:
-- - Commission: 10%
-- - Minimum Withdrawal: ₦5,000
-- ============================================

-- Drop existing table if you need to reset (CAUTION: This deletes all data)
-- DROP TABLE IF EXISTS platform_settings CASCADE;

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  minimum_withdrawal_amount DECIMAL(10,2) NOT NULL DEFAULT 5000.00 CHECK (minimum_withdrawal_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure only one settings record exists
CREATE UNIQUE INDEX IF NOT EXISTS platform_settings_singleton ON platform_settings ((true));

-- Insert default settings (will only insert if table is empty)
INSERT INTO platform_settings (commission_percentage, minimum_withdrawal_amount)
SELECT 10.00, 5000.00
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Only admins can update platform settings" ON platform_settings;

-- Create policies
CREATE POLICY "Anyone can read platform settings"
  ON platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update platform settings"
  ON platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;

-- Create updated_at trigger
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT 
  'Platform settings table created successfully!' as status,
  commission_percentage as "Commission %",
  minimum_withdrawal_amount as "Min Withdrawal (NGN)",
  created_at as "Created At"
FROM platform_settings;
