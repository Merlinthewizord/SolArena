-- Add banner_url column for tournament banners
alter table if exists tournaments
  add column if not exists banner_url text;

create index if not exists tournaments_banner_url_idx on tournaments(banner_url);
