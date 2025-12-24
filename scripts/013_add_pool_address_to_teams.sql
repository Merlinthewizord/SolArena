-- Add pool_address column to teams table for DBC pool PDA
ALTER TABLE teams ADD COLUMN IF NOT EXISTS pool_address TEXT;

COMMENT ON COLUMN teams.pool_address IS 'The DBC pool PDA address for on-chain trading';
