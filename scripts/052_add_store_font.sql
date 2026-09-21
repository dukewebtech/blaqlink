-- Storefront-only exception to the platform's fixed-font design rule: vendors
-- can pick a curated heading+body pairing for their own storefront (the
-- internal Blaqora dashboard stays locked to Bricolage Grotesque + Plus
-- Jakarta Sans). Defaults to 'modern', which IS that same current pairing —
-- so every existing vendor's storefront looks exactly as it does today.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS store_font TEXT NOT NULL DEFAULT 'modern'
    CHECK (store_font IN ('modern', 'classic', 'minimal', 'elegant'));
