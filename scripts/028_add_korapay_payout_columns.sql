-- Add KoraPay disbursement tracking columns to withdrawal_requests
ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_gateway        TEXT,
  ADD COLUMN IF NOT EXISTS kora_payout_reference TEXT,
  ADD COLUMN IF NOT EXISTS kora_payout_status    TEXT;

COMMENT ON COLUMN withdrawal_requests.payout_gateway        IS 'Gateway used for disbursement: korapay';
COMMENT ON COLUMN withdrawal_requests.kora_payout_reference IS 'KoraPay disbursement reference returned on initiation';
COMMENT ON COLUMN withdrawal_requests.kora_payout_status    IS 'KoraPay-level status: processing | success | failed';
