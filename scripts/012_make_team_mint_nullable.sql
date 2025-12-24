-- Make team_mint nullable to allow draft team creation before token launch
ALTER TABLE teams 
ALTER COLUMN team_mint DROP NOT NULL;

-- Add a comment to clarify the column purpose
COMMENT ON COLUMN teams.team_mint IS 'SPL token mint address - NULL for draft teams, populated after launch';
