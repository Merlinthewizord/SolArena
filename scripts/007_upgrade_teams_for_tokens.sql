-- Upgrade teams table with token launch state machine
alter table teams
  add column if not exists status text not null default 'draft',
  add column if not exists dbc_config_address text,
  add column if not exists quote_mint text,
  add column if not exists token_decimals int default 6,
  add column if not exists metadata_uri text,
  add column if not exists rewards_team_state_pda text,
  add column if not exists fee_vault_address text,
  add column if not exists launch_tx text,
  add column if not exists last_synced_at timestamptz;

-- Add indexes for new columns
create index if not exists teams_status_idx on teams(status);
create index if not exists teams_team_mint_idx on teams(team_mint) where team_mint is not null;

-- Update RLS policies for teams
-- Only server (service role) can update on-chain addresses and status
create policy "Service role can update team launch data"
  on teams for update
  using (current_setting('role') = 'service_role');

comment on column teams.status is 'Team token lifecycle: draft, minted, live, paused, archived';
comment on column teams.dbc_config_address is 'Meteora DBC config address';
comment on column teams.rewards_team_state_pda is 'Anchor rewards program PDA';
