-- ============================================================
-- Rename accounts from email to a simple display name.
-- Run in Supabase Dashboard → SQL Editor.
-- ============================================================

-- 1. Set each account's real name — applies to all FUTURE saves.
update profiles set display_name = 'Steven'
where id = (select id from auth.users where email = 'steven.tant@gmail.com');

update profiles set display_name = 'Sila'
where id = (select id from auth.users where email = 'cisyacaa@gmail.com');

update profiles set display_name = 'Maria'
where id = (select id from auth.users where email = 'handajamaria@gmail.com');

update profiles set display_name = 'Yori'
where id = (select id from auth.users where email = 'malindayori2711@gmail.com');

-- 2. Backfill HISTORY: swap whatever was stored before (full email, or the
-- auto-generated email-prefix like "steven.tant") to the new simple name on
-- every already-saved day.
update daily_records set staff = 'Steven'
where staff in ('steven.tant@gmail.com', 'steven.tant');

update daily_records set staff = 'Sila'
where staff in ('cisyacaa@gmail.com', 'cisyacaa');

update daily_records set staff = 'Maria'
where staff in ('handajamaria@gmail.com', 'handajamaria');

update daily_records set staff = 'Yori'
where staff in ('malindayori2711@gmail.com', 'malindayori2711');

-- 3. (Optional) Check nothing was missed — should return no unexpected rows.
select distinct staff from daily_records order by staff;
