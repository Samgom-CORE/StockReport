-- ============================================================
-- Fix: admin check was self-referencing the profiles table inside
-- its own RLS policy, which silently failed instead of returning
-- true. This replaces it with the standard safe pattern: a
-- security-definer function that bypasses RLS internally.
-- Run this in Supabase Dashboard → SQL Editor.
-- ============================================================

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Recreate the policies that need an admin check, using the function
-- instead of a raw subquery on the same table.

drop policy if exists "read own profile or admin reads all" on profiles;
create policy "read own profile or admin reads all" on profiles
  for select using (auth.uid() = id or is_admin());

drop policy if exists "read own logins or admin reads all" on login_events;
create policy "read own logins or admin reads all" on login_events
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists "insert today or admin any day" on daily_records;
create policy "insert today or admin any day" on daily_records
  for insert with check (
    date = (now() at time zone 'Asia/Jakarta')::date::text or is_admin()
  );

drop policy if exists "update today or admin any day" on daily_records;
create policy "update today or admin any day" on daily_records
  for update using (
    date = (now() at time zone 'Asia/Jakarta')::date::text or is_admin()
  );
