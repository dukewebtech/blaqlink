-- Final Onboarding System Setup
-- Run this script to complete the onboarding system setup

-- Step 1: Ensure onboarding_completed column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_submitted';
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_kyc_approved BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bvn TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS government_id_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;

-- Step 2: Create onboarding_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
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
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing conflicting policies
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "authenticated_users_select_own" ON users;
DROP POLICY IF EXISTS "authenticated_users_insert_own" ON users;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON users;
DROP POLICY IF EXISTS "admins_all_access" ON users;

DROP POLICY IF EXISTS "Users can read own onboarding progress" ON onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON onboarding_progress;
DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON onboarding_progress;
DROP POLICY IF EXISTS "authenticated_select_own_progress" ON onboarding_progress;
DROP POLICY IF EXISTS "authenticated_insert_own_progress" ON onboarding_progress;
DROP POLICY IF EXISTS "authenticated_update_own_progress" ON onboarding_progress;

-- Step 5: Create clean RLS policies for users table
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR auth.uid() = auth_id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR auth.uid() = auth_id);

CREATE POLICY "users_admin_all" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.is_admin = true OR u.role = 'admin')
    )
  );

-- Step 6: Create clean RLS policies for onboarding_progress
CREATE POLICY "onboarding_select_own" ON onboarding_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "onboarding_insert_own" ON onboarding_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "onboarding_update_own" ON onboarding_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Step 7: Remove circular foreign key constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_id_fkey;

-- Step 8: Sync auth_id for all existing users
UPDATE users SET auth_id = id WHERE auth_id IS NULL OR auth_id != id;

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_progress(user_id);

-- Step 10: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
