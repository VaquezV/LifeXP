-- supabase/migrations/20260624_add_scoring_system.sql

-- ── 1. Supprimer l'ancien système EMA ──────────────────────────────────────
drop table if exists public.category_momentum cascade;

-- ── 2. scoring_config ──────────────────────────────────────────────────────
create table public.scoring_config (
  level                int     primary key check (level between 1 and 5),
  max_habits           int     not null,
  min_completion_pct   int     not null,
  pts_scale            jsonb   not null,
  daily_maintenance    float   not null,
  points_to_next_level int     not null
);

alter table public.scoring_config enable row level security;

drop policy if exists scoring_config_select on public.scoring_config;
create policy scoring_config_select on public.scoring_config
  for select to authenticated using (true);

-- Seed des 5 niveaux
insert into public.scoring_config (level, max_habits, min_completion_pct, pts_scale, daily_maintenance, points_to_next_level)
values
  (1, 2, 80, '[{"pct":80,"pts":1},{"pct":85,"pts":2},{"pct":90,"pts":3},{"pct":95,"pts":4},{"pct":100,"pts":5}]'::jsonb, 1.5,  50),
  (2, 3, 82, '[{"pct":82,"pts":1},{"pct":87,"pts":2},{"pct":92,"pts":3},{"pct":97,"pts":4},{"pct":100,"pts":5}]'::jsonb, 2.5,  65),
  (3, 4, 84, '[{"pct":84,"pts":1},{"pct":89,"pts":2},{"pct":94,"pts":3},{"pct":99,"pts":4},{"pct":100,"pts":5}]'::jsonb, 4.0,  85),
  (4, 5, 86, '[{"pct":86,"pts":1},{"pct":91,"pts":2},{"pct":96,"pts":3},{"pct":99,"pts":4},{"pct":100,"pts":5}]'::jsonb, 6.5, 110),
  (5, 5, 95, '[{"pct":95,"pts":1},{"pct":97,"pts":3},{"pct":99,"pts":4},{"pct":100,"pts":5}]'::jsonb,               10.0, 140);

-- ── 3. category_progress ───────────────────────────────────────────────────
create table public.category_progress (
  user_id               uuid not null references auth.users(id) on delete cascade,
  category              text not null check (category in ('self_care','dev_perso','vie_familiale','vie_pro')),
  current_level         int  not null default 1 check (current_level between 1 and 5),
  points_in_level       float not null default 0,
  last_maintenance_date date,
  updated_at            timestamptz not null default now(),
  constraint category_progress_pkey primary key (user_id, category)
);

alter table public.category_progress enable row level security;

drop policy if exists category_progress_select on public.category_progress;
create policy category_progress_select on public.category_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists category_progress_insert on public.category_progress;
create policy category_progress_insert on public.category_progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists category_progress_update on public.category_progress;
create policy category_progress_update on public.category_progress
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists category_progress_delete on public.category_progress;
create policy category_progress_delete on public.category_progress
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists category_progress_service on public.category_progress;
create policy category_progress_service on public.category_progress
  for all to service_role using (true) with check (true);

create index if not exists category_progress_user_idx on public.category_progress(user_id);
