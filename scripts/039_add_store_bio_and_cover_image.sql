-- The storefront templates show a short bio under the store name and a cover
-- banner behind the avatar — neither had a column to come from.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS store_bio TEXT,
  ADD COLUMN IF NOT EXISTS store_cover_image_url TEXT;
