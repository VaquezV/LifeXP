-- A weekly duration is stored as minutes in target_value and habit_logs.value.
-- Existing weekly counts remain unchanged.
alter table public.habits
  drop constraint if exists habits_frequency_type_check;
alter table public.habits
  add constraint habits_frequency_type_check
  check (frequency_type in ('per_day', 'times_per_day', 'times_per_week', 'duration_per_week'));
alter table public.habits
  add constraint habits_duration_per_week_target_check
  check (frequency_type <> 'duration_per_week' or target_value > 0);

alter table public.preset_habits
  drop constraint if exists preset_habits_frequency_type_check;
alter table public.preset_habits
  add constraint preset_habits_frequency_type_check
  check (frequency_type in ('per_day', 'times_per_day', 'times_per_week', 'duration_per_week'));
