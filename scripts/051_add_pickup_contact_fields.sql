-- Terminal Africa rejects a persisted pickup address unless it has line2,
-- phone and a postal code, on top of street/city/state — confirmed by their
-- own "Missing pickup required fields: line2, phone, zip" error. A vendor's
-- account phone (users.phone) is frequently unset, so this is a dedicated
-- pickup contact number rather than reusing that column.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pickup_phone TEXT,
  ADD COLUMN IF NOT EXISTS pickup_line2 TEXT,
  ADD COLUMN IF NOT EXISTS pickup_postal_code TEXT;
