-- Each vendor supplies and pays for their own Terminal Africa / Shipbubble
-- account — no shared platform-level key, unlike Paystack/Korapay. Nullable:
-- only required (app-level) once a vendor switches shipping_mode to that
-- provider, checked at the point rates are requested/booked, not here.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terminal_africa_api_key TEXT,
  ADD COLUMN IF NOT EXISTS shipbubble_api_key TEXT;
