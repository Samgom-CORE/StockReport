-- ============================================================
-- Rename accounts from email to simple names
-- Run this once in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Set each account's real display name (fixes it for all FUTURE saves)
update profiles set display_name = 'Steven'
  where id = (select id from auth.users where email = 'steven.tant@gmail.com');

update profiles set display_name = 'Sila'
  where id = (select id from auth.users where email = 'cisyacaa@gmail.com');

update profiles set display_name = 'Maria'
  where id = (select id from auth.users where email = 'handajamaria@gmail.com');

update profiles set display_name = 'Yori'
  where id = (select id from auth.users where email = 'malindayori2711@gmail.com');

-- 2. Backfill HISTORY: swap whatever was stored before (full email or the
-- email-prefix the app used to fall back to) for the new simple name on
-- every already-saved day. Safe to run — rows that don't match are untouched.
update daily_records set staff = 'Steven'
  where staff in ('steven.tant@gmail.com', 'steven.tant');

update daily_records set staff = 'Sila'
  where staff in ('cisyacaa@gmail.com', 'cisyacaa');

update daily_records set staff = 'Maria'
  where staff in ('handajamaria@gmail.com', 'handajamaria');

update daily_records set staff = 'Yori'
  where staff in ('malindayori2711@gmail.com', 'malindayori2711');
