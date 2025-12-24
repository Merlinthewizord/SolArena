-- Add centralized tournaments table to eliminate duplication
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  challonge_id text unique not null,
  name text not null,
  game text not null,
  entry_fee_sol numeric not null default 0,
  max_participants int,
  status text not null default 'open', -- open | active | complete | canceled
  start_time timestamptz,
  created_by_wallet text not null,
  escrow_address text, -- future Solana escrow PDA
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tournaments_status_idx on tournaments(status);
create index if not exists tournaments_game_idx on tournaments(game);
create index if not exists tournaments_created_by_idx on tournaments(created_by_wallet);

-- Add RLS policies
alter table tournaments enable row level security;

-- Everyone can read open/active tournaments
create policy "Anyone can view active tournaments"
  on tournaments for select
  using (status in ('open', 'active', 'complete'));

-- Only authenticated users can create tournaments
create policy "Authenticated users can create tournaments"
  on tournaments for insert
  with check (auth.uid() is not null);

-- Only creator or admins can update
create policy "Creators can update their tournaments"
  on tournaments for update
  using (created_by_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Add tournament reference to participations
alter table tournament_participations
  add column if not exists tournament_uuid uuid references tournaments(id);

-- Add index for lookups
create index if not exists tournament_participations_tournament_uuid_idx 
  on tournament_participations(tournament_uuid);

comment on table tournaments is 'Centralized tournament records linked to Challonge';
