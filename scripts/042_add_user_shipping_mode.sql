-- Lets a vendor opt into live courier rates (Terminal Africa or Shipbubble)
-- instead of flat manual zones. Defaults to 'manual' so every existing vendor
-- is completely unaffected until they explicitly switch modes.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS shipping_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (shipping_mode IN ('manual', 'terminal_africa', 'shipbubble')),
  ADD COLUMN IF NOT EXISTS pickup_street TEXT,
  ADD COLUMN IF NOT EXISTS pickup_city TEXT,
  ADD COLUMN IF NOT EXISTS pickup_state TEXT,
  ADD COLUMN IF NOT EXISTS pickup_lga TEXT,
  -- Cached once Shipbubble's paid Addresses API has validated the vendor's own
  -- pickup address, so checkout doesn't re-validate (and re-bill) it on every order.
  ADD COLUMN IF NOT EXISTS shipbubble_sender_address_code TEXT;
