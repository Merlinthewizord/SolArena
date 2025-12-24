-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Team info
  name TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  
  -- Blockchain info
  team_mint TEXT UNIQUE NOT NULL, -- SPL token mint address
  bonding_curve_address TEXT, -- Meteora DBC pool address
  
  -- Team owner
  creator_wallet TEXT NOT NULL,
  
  -- Stats
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  total_staked NUMERIC DEFAULT 0,
  
  -- Metadata
  game TEXT,
  region TEXT,
  is_verified BOOLEAN DEFAULT FALSE
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_wallet TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'owner', 'captain', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Stats as team member
  wins_with_team INTEGER DEFAULT 0,
  losses_with_team INTEGER DEFAULT 0,
  earnings_with_team NUMERIC DEFAULT 0,
  
  UNIQUE(team_id, player_wallet)
);

-- Create team_token_stakes table
CREATE TABLE IF NOT EXISTS team_token_stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  staker_wallet TEXT NOT NULL,
  
  amount NUMERIC NOT NULL DEFAULT 0,
  rewards_claimed NUMERIC DEFAULT 0,
  last_claim_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(team_id, staker_wallet)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_token_stakes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Team creators can update their teams"
  ON teams FOR UPDATE
  USING (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for team_members
CREATE POLICY "Anyone can view team members"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Team owners can add members"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_id 
      AND teams.creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- RLS Policies for team_token_stakes
CREATE POLICY "Anyone can view stakes"
  ON team_token_stakes FOR SELECT
  USING (true);

CREATE POLICY "Users can stake tokens"
  ON team_token_stakes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own stakes"
  ON team_token_stakes FOR UPDATE
  USING (staker_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Indexes for performance
CREATE INDEX idx_teams_creator ON teams(creator_wallet);
CREATE INDEX idx_teams_mint ON teams(team_mint);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_player ON team_members(player_wallet);
CREATE INDEX idx_team_stakes_team ON team_token_stakes(team_id);
CREATE INDEX idx_team_stakes_staker ON team_token_stakes(staker_wallet);
