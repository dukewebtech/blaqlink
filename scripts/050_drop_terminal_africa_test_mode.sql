-- Superseded immediately: the environment is now detected from the key's
-- own prefix (sk_test_ vs sk_live_) in lib/shipping/terminal-africa.ts,
-- so this manual toggle was never wired into any code path and is dead.
ALTER TABLE users
  DROP COLUMN IF EXISTS terminal_africa_test_mode;
