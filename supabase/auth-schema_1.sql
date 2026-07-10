-- ============================================================
-- Simple Login + Roles + Sign-in History
-- Run this in Supabase Dashboard → SQL Editor, AFTER supabase/schema.sql
-- ============================================================

-- IMPORTANT (do this once, in the dashboard, not SQL):
-- Authentication → Providers → Email → turn OFF "Allow new users to sign up".
-- This means the only way to get an account is for you to create it under
-- Authentication → Users → Add User. No stranger can self-register.

-- 1. A profile row for every account: display name + role (admin/staff)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "read own profile or admin reads all" on profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "users update own display name" on profiles
  for update using (auth.uid() = id);

-- Auto-create a profile (default role: staff) whenever you add a new account
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'staff'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. Sign-in history log
create table if not exists login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table login_events enable row level security;

create policy "insert own login event" on login_events
  for insert with check (auth.uid() = user_id);

create policy "read own logins or admin reads all" on login_events
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 3. Lock down daily_records now that a login is required
-- Remove the old "anyone with the link" policies from schema.sql
drop policy if exists "public read daily_records" on daily_records;
drop policy if exists "public write daily_records" on daily_records;
drop policy if exists "public update daily_records" on daily_records;

-- Any signed-in user can read every day (needed for History / Weekly Report)
create policy "signed in users read daily_records" on daily_records
  for select using (auth.uid() is not null);

-- Signed-in staff can only save TODAY's record (Jakarta time).
-- Admins can save any day, including corrections to past days.
create policy "insert today or admin any day" on daily_records
  for insert with check (
    date = (now() at time zone 'Asia/Jakarta')::date::text
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "update today or admin any day" on daily_records
  for update using (
    date = (now() at time zone 'Asia/Jakarta')::date::text
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- After running everything above:
--
-- 1. Supabase Dashboard → Authentication → Users → Add User.
--    Create one account for yourself and one for each staff member
--    (just an email + password each — they don't need to be real inboxes,
--    e.g. sari@samgom.local works fine).
--
-- 2. Make yourself admin by running this once (replace with your email):
--
--    update profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'YOUR-EMAIL@example.com');
--
-- Everyone else stays 'staff' by default automatically.
-- ============================================================
