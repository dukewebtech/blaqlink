-- Disable email confirmation requirement for Supabase Auth
-- This allows users to sign in immediately after signup without email verification

-- Note: This is a temporary solution. Email verification should be re-enabled in production.
-- To re-enable, you would need to update the Supabase dashboard settings or use the Supabase Management API.

-- For now, we'll handle this in the application layer by auto-confirming users
-- The actual Supabase project setting needs to be changed in the Supabase dashboard:
-- Authentication > Settings > Enable email confirmations (toggle OFF)

-- This script serves as documentation of the change
-- The actual implementation is in the signup route where we'll use autoConfirm option
