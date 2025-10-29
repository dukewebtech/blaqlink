-- Add bank account details columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Add comment
COMMENT ON COLUMN users.bank_name IS 'User bank name for payouts';
COMMENT ON COLUMN users.account_number IS 'User bank account number for payouts';
COMMENT ON COLUMN users.account_name IS 'User bank account holder name for payouts';
