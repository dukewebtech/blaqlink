-- Fallback used by /api/shipping/rates when a product has no weight_kg set,
-- so a vendor on live rates isn't hard-blocked the moment one item is
-- missing a weight — they can set one sane default instead of editing every
-- product before checkout works. Per-product weight_kg still wins when set.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS default_parcel_weight_kg NUMERIC;
