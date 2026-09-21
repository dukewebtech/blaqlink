-- Short-lived cache of the courier quotes shown to a shopper, so
-- /api/checkout/initialize can verify a chosen rate's fee against what the
-- provider actually quoted instead of trusting a client-supplied amount.
-- Same "server is the source of truth" shape as payment_sessions.
CREATE TABLE IF NOT EXISTS shipping_rate_quotes (
  id          TEXT PRIMARY KEY,
  store_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL CHECK (provider IN ('terminal_africa', 'shipbubble')),
  rates       JSONB NOT NULL,
  -- Provider-specific handles needed to book the chosen rate later
  -- (Terminal: none extra, rate_id is enough. Shipbubble: request_token).
  request_token TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rate_quotes_created_at ON shipping_rate_quotes(created_at);

ALTER TABLE shipping_rate_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON shipping_rate_quotes;
CREATE POLICY "Service role only"
  ON shipping_rate_quotes
  USING (false)
  WITH CHECK (false);
