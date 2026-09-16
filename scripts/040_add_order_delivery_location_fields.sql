-- Storefront checkout now collects state/city/postal code alongside the free-form
-- delivery_address (see scripts/035_add_order_delivery_and_selection_fields.sql).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_state TEXT,
  ADD COLUMN IF NOT EXISTS delivery_city TEXT,
  ADD COLUMN IF NOT EXISTS delivery_postal_code TEXT;
