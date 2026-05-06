-- Create onboarding_progress table to track user onboarding steps
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_completed INTEGER NOT NULL DEFAULT 0,
  business_info_completed BOOLEAN DEFAULT FALSE,
  kyc_info_completed BOOLEAN DEFAULT FALSE,
  bank_info_completed BOOLEAN DEFAULT FALSE,
  store_setup_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add onboarding and KYC fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_category TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS bvn TEXT,
ADD COLUMN IF NOT EXISTS government_id_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending_review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_kyc_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS store_logo_url TEXT,
ADD COLUMN IF NOT EXISTS store_brand_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS store_template TEXT DEFAULT 'marketplace-pro',
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- RLS Policies for onboarding_progress
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding progress"
  ON onboarding_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
  ON onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all onboarding progress
CREATE POLICY "Admins can view all onboarding progress"
  ON onboarding_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- Admins can update any onboarding progress (for KYC approval)
CREATE POLICY "Admins can update any onboarding progress"
  ON onboarding_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_admin_kyc_approved ON users(admin_kyc_approved);

-- Create function to auto-create onboarding progress on user creation
CREATE OR REPLACE FUNCTION create_onboarding_progress_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO onboarding_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create onboarding progress
DROP TRIGGER IF EXISTS on_user_created_create_onboarding ON users;
CREATE TRIGGER on_user_created_create_onboarding
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_onboarding_progress_for_user();
