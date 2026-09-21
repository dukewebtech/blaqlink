-- Vendor-facing /help page reads these; only admins can set them (same RLS
-- already on platform_settings: anyone can read, only admins can update).
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS support_email TEXT,
  ADD COLUMN IF NOT EXISTS tawkto_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_community_url TEXT;
