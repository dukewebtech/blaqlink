-- Shipbubble's fetch_rates call returns a request_token that its create-label
-- (booking) call needs later — carried on the order between checkout and the
-- post-payment booking hook, same way payment_sessions carries order data
-- between initialize and verify. Null for Terminal Africa orders (not needed).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_request_token TEXT;
