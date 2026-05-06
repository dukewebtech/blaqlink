-- Add profile image and additional fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Update existing users to have default values
UPDATE users
SET business_name = 'My Store'
WHERE business_name IS NULL;
