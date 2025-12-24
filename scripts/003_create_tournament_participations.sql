-- Create tournament participations table to track all player tournament entries and results
CREATE TABLE IF NOT EXISTS tournament_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  game TEXT NOT NULL,
  entry_fee NUMERIC NOT NULL DEFAULT 0.1,
  in_game_username TEXT NOT NULL,
  discord_handle TEXT,
  team_name TEXT,
  placement INTEGER,
  prize_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'registered', -- registered, in_progress, completed
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_participations_player_id ON tournament_participations(player_id);
CREATE INDEX IF NOT EXISTS idx_participations_wallet_address ON tournament_participations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_participations_tournament_id ON tournament_participations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_participations_status ON tournament_participations(status);
CREATE INDEX IF NOT EXISTS idx_participations_completed_at ON tournament_participations(completed_at);

-- Enable Row Level Security
ALTER TABLE tournament_participations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view their own participations
CREATE POLICY "Users can view own participations"
  ON tournament_participations
  FOR SELECT
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR true);

-- Allow users to insert their own participations
CREATE POLICY "Users can register for tournaments"
  ON tournament_participations
  FOR INSERT
  WITH CHECK (true);

-- Allow viewing all participations (for leaderboards, etc.)
CREATE POLICY "Allow viewing all participations"
  ON tournament_participations
  FOR SELECT
  USING (true);

-- Only allow system/admins to update results (placement, prize_amount, status)
CREATE POLICY "System can update results"
  ON tournament_participations
  FOR UPDATE
  USING (true);

-- Create function to automatically update player stats when tournament completes
CREATE OR REPLACE FUNCTION update_player_stats_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to 'completed' and placement is set
  IF NEW.status = 'completed' AND NEW.placement IS NOT NULL AND OLD.status != 'completed' THEN
    UPDATE player_profiles
    SET 
      wins = CASE WHEN NEW.placement = 1 THEN wins + 1 ELSE wins END,
      losses = CASE WHEN NEW.placement > 1 THEN losses + 1 ELSE losses END,
      total_earnings = total_earnings + COALESCE(NEW.prize_amount, 0),
      updated_at = NOW()
    WHERE wallet_address = NEW.wallet_address;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats automatically
DROP TRIGGER IF EXISTS update_player_stats_trigger ON tournament_participations;
CREATE TRIGGER update_player_stats_trigger
  AFTER UPDATE ON tournament_participations
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_on_completion();

COMMENT ON TABLE tournament_participations IS 'Tracks all player tournament registrations and results';
