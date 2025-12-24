-- Upgrade staking table to cache on-chain state
alter table team_token_stakes
  add column if not exists stake_account_pda text,
  add column if not exists reward_debt numeric default 0,
  add column if not exists claimable numeric default 0,
  add column if not exists synced_at timestamptz;

create index if not exists team_token_stakes_pda_idx on team_token_stakes(stake_account_pda)
  where stake_account_pda is not null;

comment on column team_token_stakes.stake_account_pda is 'On-chain stake account PDA';
comment on column team_token_stakes.reward_debt is 'Rewards already accounted for';
comment on column team_token_stakes.claimable is 'Unclaimed rewards available';
comment on column team_token_stakes.synced_at is 'Last sync with on-chain state';
