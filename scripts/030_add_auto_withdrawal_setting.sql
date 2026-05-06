ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS auto_withdrawal_enabled BOOLEAN NOT NULL DEFAULT false;
