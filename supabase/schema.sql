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

-- RLS par utilisateur : chacun n'accède qu'à ses propres données.
alter table public.checkins enable row level security;
alter table public.checkins alter column user_id set default auth.uid();
drop policy if exists open_checkins_policy on public.checkins;
create policy checkins_select on public.checkins for select to authenticated using (auth.uid() = user_id);
create policy checkins_insert on public.checkins for insert to authenticated with check (auth.uid() = user_id);
create policy checkins_update on public.checkins for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy checkins_delete on public.checkins for delete to authenticated using (auth.uid() = user_id);

-- domain_scores : appartenance via le checkin parent (pas de user_id propre).
alter table public.domain_scores enable row level security;
drop policy if exists open_domain_scores_policy on public.domain_scores;
create policy domain_scores_select on public.domain_scores for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_insert on public.domain_scores for insert to authenticated
  with check (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_update on public.domain_scores for update to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_delete on public.domain_scores for delete to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));

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

-- RLS par utilisateur sur habits / habit_logs.
alter table public.habits enable row level security;
alter table public.habits alter column user_id set default auth.uid();
drop policy if exists open_habits_policy on public.habits;
create policy habits_select on public.habits for select to authenticated using (auth.uid() = user_id);
create policy habits_insert on public.habits for insert to authenticated with check (auth.uid() = user_id);
create policy habits_update on public.habits for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy habits_delete on public.habits for delete to authenticated using (auth.uid() = user_id);

alter table public.habit_logs enable row level security;
alter table public.habit_logs alter column user_id set default auth.uid();
drop policy if exists open_habit_logs_policy on public.habit_logs;
create policy habit_logs_select on public.habit_logs for select to authenticated using (auth.uid() = user_id);
create policy habit_logs_insert on public.habit_logs for insert to authenticated with check (auth.uid() = user_id);
create policy habit_logs_update on public.habit_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy habit_logs_delete on public.habit_logs for delete to authenticated using (auth.uid() = user_id);

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

-- Données de référence : lecture seule pour les utilisateurs authentifiés.
alter table public.preset_habits enable row level security;
drop policy if exists open_preset_habits_policy on public.preset_habits;
create policy preset_habits_select on public.preset_habits for select to authenticated using (true);

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

alter table public.preset_badges enable row level security;
drop policy if exists open_preset_badges_policy on public.preset_badges;
create policy preset_badges_select on public.preset_badges for select to authenticated using (true);

alter table public.habits add column if not exists preset_habit_id uuid references public.preset_habits(id) on delete set null;

create index if not exists habits_preset_habit_idx on public.habits(preset_habit_id);
