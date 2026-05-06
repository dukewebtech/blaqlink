-- Temporary store for order data between KoraPay charge init and verify.
-- Records are deleted after the order is created or after 2 hours (stale cleanup).
CREATE TABLE IF NOT EXISTS payment_sessions (
  reference   TEXT PRIMARY KEY,
  gateway     TEXT NOT NULL DEFAULT 'korapay',
  order_data  JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-delete sessions older than 2 hours via a scheduled cron (optional, or clean up manually)
-- Simple RLS: only service-role key can read/write
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON payment_sessions
  USING (false)
  WITH CHECK (false);
