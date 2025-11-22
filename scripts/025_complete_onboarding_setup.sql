-- Complete Onboarding System Setup
-- Run this script to fix user profiles and enable onboarding

-- Step 1: Create onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Step 2: Business Information
  business_name TEXT,
  store_name TEXT,
  business_category TEXT,
  business_address TEXT,
  
  -- Step 3: Identity Upload (KYC)
  full_name TEXT,
  date_of_birth DATE,
  bvn TEXT,
  government_id_url TEXT,
  selfie_url TEXT,
  
  -- Step 4: Bank Account
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  
  -- Step 5: Store Setup
  store_template TEXT,
  store_logo_url TEXT,
  store_brand_color TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Step 2: Add KYC columns to users table if they don't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS admin_kyc_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Step 3: Enable RLS on onboarding_progress
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for onboarding_progress
DROP POLICY IF EXISTS "Users can view own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Admins can view all onboarding progress" ON public.onboarding_progress;

CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_id = auth.uid() 
      AND (users.is_admin = TRUE OR users.role = 'admin')
    )
  );

-- Step 5: Update KYC policies for users table
DROP POLICY IF EXISTS "Admins can update KYC status" ON public.users;

CREATE POLICY "Admins can update KYC status"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS admin_user
      WHERE admin_user.auth_id = auth.uid() 
      AND (admin_user.is_admin = TRUE OR admin_user.role = 'admin')
    )
  );

-- Step 6: Fix user creation trigger to ensure profiles are always created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert the new user profile
  INSERT INTO public.users (id, auth_id, email, full_name, role, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendor'),
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();
  
  -- Create initial onboarding progress
  INSERT INTO public.onboarding_progress (user_id, current_step)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 7: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Create profiles for existing auth users who don't have profiles
INSERT INTO public.users (id, auth_id, email, full_name, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'role', 'vendor'),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.auth_id = au.id
)
ON CONFLICT (auth_id) DO NOTHING;

-- Step 9: Create onboarding progress for existing users who don't have it
INSERT INTO public.onboarding_progress (user_id, current_step)
SELECT au.id, 0
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.onboarding_progress op WHERE op.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 10: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.onboarding_progress TO postgres, service_role, authenticated;
GRANT ALL ON public.users TO postgres, service_role;

-- Verification queries (optional - comment out in production)
-- SELECT COUNT(*) as auth_users FROM auth.users;
-- SELECT COUNT(*) as profile_users FROM public.users;
-- SELECT COUNT(*) as onboarding_records FROM public.onboarding_progress;
