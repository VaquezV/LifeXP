create extension if not exists "pgcrypto";

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint checkins_user_date_unique unique (user_id, date)
);

create table if not exists public.domain_scores (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  domain text not null,
  score integer not null check (score in (0, 1, 2)),
  value integer,
  constraint domain_scores_checkin_domain_unique unique (checkin_id, domain)
);

alter table public.domain_scores add column if not exists value integer;

create index if not exists checkins_user_date_idx on public.checkins(user_id, date desc);
create index if not exists domain_scores_checkin_idx on public.domain_scores(checkin_id);

-- No auth in this app: anon users need open access.
alter table public.checkins disable row level security;
alter table public.domain_scores disable row level security;

drop policy if exists open_checkins_policy on public.checkins;
drop policy if exists open_domain_scores_policy on public.domain_scores;

create policy open_checkins_policy on public.checkins
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy open_domain_scores_policy on public.domain_scores
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Habits table: flexible parameterized habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category text not null check (category in ('self_care', 'dev_perso', 'vie_familiale', 'vie_pro')),
  name text not null,
  emoji text,
  frequency_type text not null check (frequency_type in ('per_day', 'times_per_day', 'times_per_week')),
  frequency_value integer not null,
  min_value integer default 0,
  target_value integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint habits_user_name_unique unique (user_id, name)
);

-- Habit logs: one entry per habit per day
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  value integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint habit_logs_user_habit_date_unique unique (user_id, habit_id, date)
);

create index if not exists habits_user_idx on public.habits(user_id);
create index if not exists habit_logs_user_date_idx on public.habit_logs(user_id, date desc);
create index if not exists habit_logs_habit_idx on public.habit_logs(habit_id);

-- RLS: allow anon/authenticated users full access
alter table public.habits disable row level security;
alter table public.habit_logs disable row level security;

drop policy if exists open_habits_policy on public.habits;
drop policy if exists open_habit_logs_policy on public.habit_logs;

create policy open_habits_policy on public.habits
  for all to anon, authenticated using (true) with check (true);

create policy open_habit_logs_policy on public.habit_logs
  for all to anon, authenticated using (true) with check (true);

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

alter table public.habits add column if not exists preset_habit_id uuid references public.preset_habits(id) on delete set null;

create index if not exists habits_preset_habit_idx on public.habits(preset_habit_id);
