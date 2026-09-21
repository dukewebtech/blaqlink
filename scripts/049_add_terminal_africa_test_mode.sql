-- Terminal Africa has genuinely separate sandbox/live API base URLs (unlike
-- Shipbubble, whose key alone determines the environment on the same URL),
-- so which one to call can't be inferred from the key — the vendor has to
-- say. Defaults to false (live) to match the behavior every vendor already
-- had before this toggle existed (the code only ever called the live URL).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terminal_africa_test_mode BOOLEAN NOT NULL DEFAULT false;
