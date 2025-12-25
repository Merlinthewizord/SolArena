-- Create table for ARENA token wager tournaments
CREATE TABLE IF NOT EXISTS arena_wager_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tournament details
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  entry_wager NUMERIC NOT NULL, -- Amount of ARENA tokens to wager
  max_participants INTEGER NOT NULL DEFAULT 100,
  current_participants INTEGER NOT NULL DEFAULT 0,
  
  -- Escrow wallet that holds all wagered tokens
  escrow_wallet TEXT NOT NULL,
  
  -- Prize distribution
  total_pot NUMERIC NOT NULL DEFAULT 0,
  winner_amount NUMERIC NOT NULL DEFAULT 0, -- 50% of pot
  giveaway_amount NUMERIC NOT NULL DEFAULT 0, -- 25% of pot
  burn_amount NUMERIC NOT NULL DEFAULT 0, -- 25% of pot
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'registration', -- registration, active, completed, cancelled
  winner_wallet TEXT,
  prize_distributed_at TIMESTAMPTZ,
  burn_tx_signature TEXT,
  
  -- Tournament timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  
  -- Creator
  created_by_wallet TEXT NOT NULL,
  
  -- Format (best of X)
  match_format TEXT NOT NULL DEFAULT 'best_of_7' -- best_of_1, best_of_3, best_of_5, best_of_7
);

-- Create table for tournament participants/wagers
CREATE TABLE IF NOT EXISTS arena_wager_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  tournament_id UUID NOT NULL REFERENCES arena_wager_tournaments(id) ON DELETE CASCADE,
  player_wallet TEXT NOT NULL,
  player_id UUID REFERENCES player_profiles(id),
  
  -- Wager details
  wager_amount NUMERIC NOT NULL,
  wager_tx_signature TEXT NOT NULL,
  
  -- Player info
  in_game_username TEXT NOT NULL,
  discord_handle TEXT,
  team_name TEXT,
  
  -- Results
  placement INTEGER,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  prize_received NUMERIC DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'registered', -- registered, active, eliminated, winner
  
  UNIQUE(tournament_id, player_wallet)
);

-- Create indexes
CREATE INDEX idx_arena_tournaments_status ON arena_wager_tournaments(status);
CREATE INDEX idx_arena_tournaments_start_time ON arena_wager_tournaments(start_time);
CREATE INDEX idx_arena_tournaments_creator ON arena_wager_tournaments(created_by_wallet);
CREATE INDEX idx_arena_participants_tournament ON arena_wager_participants(tournament_id);
CREATE INDEX idx_arena_participants_player ON arena_wager_participants(player_wallet);

-- Enable RLS
ALTER TABLE arena_wager_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_wager_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view wager tournaments"
  ON arena_wager_tournaments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create wager tournaments"
  ON arena_wager_tournaments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Creators can update own tournaments"
  ON arena_wager_tournaments FOR UPDATE
  TO public
  USING (created_by_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Anyone can view participants"
  ON arena_wager_participants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Players can register for tournaments"
  ON arena_wager_participants FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Players can update own participation"
  ON arena_wager_participants FOR UPDATE
  TO public
  USING (player_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Function to update tournament pot when player joins
CREATE OR REPLACE FUNCTION update_tournament_pot()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE arena_wager_tournaments
  SET 
    total_pot = total_pot + NEW.wager_amount,
    current_participants = current_participants + 1,
    winner_amount = (total_pot + NEW.wager_amount) * 0.50,
    giveaway_amount = (total_pot + NEW.wager_amount) * 0.25,
    burn_amount = (total_pot + NEW.wager_amount) * 0.25,
    updated_at = NOW()
  WHERE id = NEW.tournament_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pot_on_join
  AFTER INSERT ON arena_wager_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_pot();

-- Function to track tournament completion and update player stats
CREATE OR REPLACE FUNCTION complete_arena_tournament()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update winner's profile stats
    UPDATE player_profiles
    SET 
      wins = wins + 1,
      total_earnings = total_earnings + NEW.winner_amount,
      updated_at = NOW()
    WHERE wallet_address = NEW.winner_wallet;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_tournament_complete
  AFTER UPDATE ON arena_wager_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION complete_arena_tournament();
