-- Sync user profiles with auth metadata
-- This updates existing user profiles to match their auth metadata

-- Update existing user profiles with data from auth.users metadata
UPDATE public.users u
SET 
  full_name = COALESCE(au.raw_user_meta_data->>'full_name', u.full_name, u.email),
  role = COALESCE(au.raw_user_meta_data->>'role', u.role, 'vendor'),
  updated_at = NOW()
FROM auth.users au
WHERE u.auth_id = au.id
  AND (
    u.full_name IS NULL 
    OR u.full_name = '' 
    OR u.full_name != COALESCE(au.raw_user_meta_data->>'full_name', u.full_name)
  );

-- Verify the trigger function is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, auth_id, email, full_name, role)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendor')
  )
  ON CONFLICT (auth_id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = COALESCE(EXCLUDED.role, users.role),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
