# Setup notes — Daily Outlet Stock Book

Your v0 export was already wired for Supabase (`lib/storage.ts` and
`lib/supabase/client.ts` were there), but two things were missing/broken.
Here's what I changed and what you still need to do.

## What was broken (now fixed)
1. **`components/daily-stock-sheet.tsx`** — `loadRecords()` is async
   (it's a real Supabase query) but was being called without `await`, and
   `handleSave` called a `saveRecords()` function that didn't exist
   anywhere in the project. Both are fixed: data now loads properly on
   mount, and saving calls the real `saveRecord()` against Supabase, with
   a "Saving…" state and an error toast if the connection fails.
2. **`components/monthly-history.tsx`** — same missing-`await` bug on the
   history page. Fixed the same way, plus a visible error state if the
   history fails to load instead of failing silently.
3. **No database schema was included in the export.** Added
   `supabase/schema.sql` — it creates a `daily_records` table matching
   exactly what `lib/storage.ts` reads and writes (`date`, `staff`, `calc`
   jsonb, `simple` jsonb).

## Get it running
1. Create a free project at supabase.com.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Go to **Project Settings → API**, copy your Project URL and anon
   public key.
4. `cp .env.local.example .env.local` and paste those two values in.
5. `pnpm install` (this project uses pnpm — there's a `pnpm-lock.yaml`)
6. `pnpm dev` → open http://localhost:3000

## How the data model works
- Each product category is either **calculated** (Cake Slices, Soft
  Cookies) or **simple** (Other Products).
- Calculated products track `Masuk` (stock in), `Free`/`Sample`, `Jual`
  (sold in-store), and `Online` (sold online) each day. Closing stock
  (`Akhir`) is computed automatically: `Awal + Masuk − Free − Jual − Online`.
  Tomorrow's `Awal` (opening) is just today's `Akhir` — the app walks
  backward through saved days to compute it, so you never enter opening
  stock by hand.
- Simple products (butter cookies, birthday packs, mineral water) just
  need a daily count, no formula.
- The **History** page (`/history`) shows every saved day, grouped by
  month, read-only.
- Product names live in `lib/stock-data.ts` — edit the `CATEGORIES` array
  there to add, rename, or remove products.

## On staff access
Like the schema, this currently uses Supabase's public `anon` key with
open row-level-security policies — no login, just a shared link. Staff
type their name into the "Nama Staff" field each time they save. If you
want individual staff logins later (e.g. to lock editing to your own
day's entry, or see who edited what with certainty), that's a clean
follow-up with Supabase Auth — just ask.
