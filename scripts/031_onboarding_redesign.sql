-- Onboarding redesign: single-step gate, progressive checklist, revised KYC

-- Add store slug and location fields to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS store_slug    TEXT,
  ADD COLUMN IF NOT EXISTS store_city    TEXT,
  ADD COLUMN IF NOT EXISTS store_state   TEXT,
  ADD COLUMN IF NOT EXISTS legal_name    TEXT,
  ADD COLUMN IF NOT EXISTS payout_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Add checklist + slug/location fields to onboarding_progress
ALTER TABLE onboarding_progress
  ADD COLUMN IF NOT EXISTS store_slug              TEXT,
  ADD COLUMN IF NOT EXISTS store_city              TEXT,
  ADD COLUMN IF NOT EXISTS store_state             TEXT,
  ADD COLUMN IF NOT EXISTS checklist_store_customized BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checklist_store_shared     BOOLEAN NOT NULL DEFAULT FALSE;

-- Unique index on store_slug so no two vendors share a URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_store_slug ON users (store_slug)
  WHERE store_slug IS NOT NULL;
