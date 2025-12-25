-- Clear invalid pool addresses for teams where the pool doesn't exist on-chain
-- This allows teams to retry token launches after failed transactions

UPDATE teams 
SET pool_address = NULL 
WHERE id = 'd20b9b93-55ef-4d92-ac7c-7ccb9f9a06b1'
AND pool_address IS NOT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN teams.pool_address IS 'DBC pool address on-chain. Only set after successful pool creation verification.';
