-- Admin audit log for transparency and compliance
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_wallet text not null,
  action text not null,
  target_type text,
  target_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_actor_idx on admin_audit_log(actor_wallet);
create index if not exists admin_audit_log_action_idx on admin_audit_log(action);
create index if not exists admin_audit_log_created_at_idx on admin_audit_log(created_at desc);

-- RLS: Insert only via service role, read only by admins
alter table admin_audit_log enable row level security;

-- Read policy: only for admin wallets (we'll check via player_profiles.role)
create policy "Admins can view audit log"
  on admin_audit_log for select
  using (
    exists (
      select 1 from player_profiles
      where wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      and role = 'admin'
    )
  );

-- No public insert policy - only service role can insert

comment on table admin_audit_log is 'Audit trail for administrative actions';
