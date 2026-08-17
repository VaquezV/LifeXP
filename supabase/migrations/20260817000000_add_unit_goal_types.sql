-- Adds unit_per_day / unit_per_week goal types (large non-temporal quantities,
-- e.g. 10000 steps/day, 7000 kcal/week) plus a free-text unit_label and a
-- per-user dynamic unit list (user_units) fed by the add-habit combobox.
alter table public.habits
  drop constraint if exists habits_frequency_type_check;
alter table public.habits
  add constraint habits_frequency_type_check
  check (frequency_type in ('per_day', 'times_per_day', 'times_per_week', 'duration_per_week', 'unit_per_day', 'unit_per_week'));

alter table public.preset_habits
  drop constraint if exists preset_habits_frequency_type_check;
alter table public.preset_habits
  add constraint preset_habits_frequency_type_check
  check (frequency_type in ('per_day', 'times_per_day', 'times_per_week', 'duration_per_week', 'unit_per_day', 'unit_per_week'));

alter table public.habits add column if not exists unit_label text;
alter table public.preset_habits add column if not exists unit_label text;

create table if not exists public.user_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_units_user_label_unique unique (user_id, label)
);

alter table public.user_units enable row level security;
create policy user_units_select on public.user_units for select to authenticated using (auth.uid() = user_id);
create policy user_units_insert on public.user_units for insert to authenticated with check (auth.uid() = user_id);
