-- Run this once in the Supabase SQL editor for this project
-- (https://supabase.com/dashboard/project/nrtovlmelrwvezwhkdoh/sql/new)
-- before the app's cloud sync will work. Until it's run, the app keeps
-- working fine off localStorage only - cloud sync calls fail silently
-- and are retried on next load.

create table if not exists avatar_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stats jsonb not null default '{}'::jsonb,
  total_workouts integer not null default 0,
  logged_sessions jsonb not null default '[]'::jsonb,
  last_trained jsonb not null default '{}'::jsonb,
  skin_tone text,
  body_type text,
  hair_style text,
  hair_color text,
  facial_hair text,
  glasses boolean not null default false,
  history jsonb not null default '[]'::jsonb,
  unlocked_achievements jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Safe to re-run: adds the column if this script was already run before
-- unlocked_achievements existed.
alter table avatar_progress add column if not exists unlocked_achievements jsonb not null default '[]'::jsonb;

alter table avatar_progress enable row level security;

create policy "Users can view own avatar progress"
  on avatar_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own avatar progress"
  on avatar_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own avatar progress"
  on avatar_progress for update
  using (auth.uid() = user_id);

-- ── ANALYTICS ─────────────────────────────────────────────────
-- Write-only funnel log: landing views, CTA clicks, trial usage,
-- signup/payment completion, workout logging. Anyone can INSERT
-- (that's how client-side analytics works - the anon key is public by
-- design) but nobody can SELECT through the API, so the data is only
-- readable from the Supabase dashboard/SQL editor, not scrapable by
-- visitors.
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  session_id text not null,
  user_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table analytics_events enable row level security;

create policy "Anyone can log an event"
  on analytics_events for insert
  to anon, authenticated
  with check (true);

-- Handy queries once you have data:
--   Funnel counts:
--     select event, count(*) from analytics_events group by event order by count(*) desc;
--   Trial -> paid conversion rate:
--     select
--       count(*) filter (where event = 'cta_click' and meta->>'target' = 'trial') as trial_starts,
--       count(*) filter (where event = 'payment_complete') as conversions;
