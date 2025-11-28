-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  business_name TEXT,
  store_name TEXT,
  business_category TEXT,
  business_address TEXT,
  full_name TEXT,
  date_of_birth DATE,
  bvn TEXT,
  government_id_url TEXT,
  selfie_url TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  store_template TEXT,
  store_logo_url TEXT,
  store_brand_color TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add KYC fields to users table if they don't exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS admin_kyc_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_progress
CREATE POLICY "Users can view own onboarding progress"
  ON onboarding_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding progress"
  ON onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding progress"
  ON onboarding_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id 
  ON onboarding_progress(user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_updated_at();

-- Add sample Nigerian banks for reference
COMMENT ON COLUMN onboarding_progress.bank_name IS 'Nigerian banks: Access Bank, GTBank, UBA, Zenith Bank, First Bank, etc.';
