-- Add role column to player_profiles for admin management
alter table player_profiles
  add column if not exists role text not null default 'player';

create index if not exists player_profiles_role_idx on player_profiles(role);

comment on column player_profiles.role is 'User role: player, admin, moderator';

-- Create admin wallets reference table for easy management
create table if not exists admin_wallets (
  wallet_address text primary key,
  role text not null default 'admin',
  granted_by text,
  granted_at timestamptz not null default now()
);

alter table admin_wallets enable row level security;

-- Only admins can view admin wallets
create policy "Admins can view admin wallets"
  on admin_wallets for select
  using (
    exists (
      select 1 from player_profiles
      where wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      and role = 'admin'
    )
  );

comment on table admin_wallets is 'Administrative wallet addresses';
