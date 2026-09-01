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
