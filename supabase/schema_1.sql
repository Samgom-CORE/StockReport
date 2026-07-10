-- ============================================================
-- Daily Outlet Stock Book — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- Matches the shape lib/storage.ts already reads/writes.
-- ============================================================

create table if not exists daily_records (
  date text primary key,        -- ISO date, e.g. '2026-07-01'
  staff text,                   -- name of the staff who filled the sheet
  calc jsonb not null default '{}'::jsonb,    -- per-product { masuk, free, jual, online }
  simple jsonb not null default '{}'::jsonb,  -- per-product stock count
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every save
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_daily_records_updated_at on daily_records;
create trigger trg_daily_records_updated_at
  before update on daily_records
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- Simplest setup: no login required, app uses the public anon key,
-- and anyone with the link can read/write. Good for an internal
-- staff tool on a private link. Tighten later if you add staff auth.
-- ============================================================
alter table daily_records enable row level security;

create policy "public read daily_records" on daily_records
  for select using (true);

create policy "public write daily_records" on daily_records
  for insert with check (true);

create policy "public update daily_records" on daily_records
  for update using (true);
