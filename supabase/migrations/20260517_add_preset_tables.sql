-- Phase 1: Create preset habit tables and add columns to existing tables

-- Create preset_habits table
create table if not exists public.preset_habits (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  category text not null check (category in ('self_care', 'dev_perso', 'vie_familiale', 'vie_pro')),
  expertise text not null check (expertise in ('debutant', 'intermediaire', 'expert', 'enfant', 'ado', 'adulte_homme', 'adulte_femme', 'standard')),
  emoji text,

  frequency_type text not null check (frequency_type in ('per_day', 'times_per_day', 'times_per_week')),
  frequency_value integer not null,
  min_value integer not null,
  target_value integer not null,
  max_value integer not null,

  editable_min_value boolean default true,
  editable_target_value boolean default true,
  editable_max_value boolean default true,
  editable_frequency_type boolean default true,
  editable_frequency_value boolean default true,

  created_at timestamptz not null default timezone('utc', now()),

  constraint preset_habits_name_expertise_unique unique (name, expertise)
);

create index if not exists preset_habits_category_idx on public.preset_habits(category);
create index if not exists preset_habits_name_idx on public.preset_habits(name);

alter table public.preset_habits disable row level security;

drop policy if exists open_preset_habits_policy on public.preset_habits;

create policy open_preset_habits_policy on public.preset_habits
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Create preset_badges table
create table if not exists public.preset_badges (
  id uuid primary key default gen_random_uuid(),
  preset_habit_id uuid not null references public.preset_habits(id) on delete cascade,

  badge_level integer not null,
  consecutive_days integer not null,
  badge_name text,
  badge_emoji text,

  created_at timestamptz not null default timezone('utc', now()),

  constraint preset_badges_preset_level_unique unique (preset_habit_id, badge_level)
);

create index if not exists preset_badges_preset_habit_idx on public.preset_badges(preset_habit_id);

alter table public.preset_badges disable row level security;

drop policy if exists open_preset_badges_policy on public.preset_badges;

create policy open_preset_badges_policy on public.preset_badges
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Add columns to existing tables
alter table public.habits add column if not exists preset_habit_id uuid references public.preset_habits(id) on delete set null;

create index if not exists habits_preset_habit_idx on public.habits(preset_habit_id);

alter table public.habit_logs add column if not exists preset_habit_id uuid references public.preset_habits(id) on delete set null;

create index if not exists habit_logs_preset_habit_idx on public.habit_logs(preset_habit_id);
