-- Tracking/booking state for orders placed against a live courier rate.
-- All null for manual-mode vendors (and for pickup orders) — there's no
-- booking step in that flow, same as before this migration.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_provider TEXT CHECK (shipping_provider IN ('terminal_africa', 'shipbubble')),
  ADD COLUMN IF NOT EXISTS shipping_rate_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_status TEXT CHECK (shipping_status IN ('pending_booking', 'booked', 'failed'));
