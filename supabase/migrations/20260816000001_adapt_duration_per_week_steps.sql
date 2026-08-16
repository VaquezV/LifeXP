-- The first duration migration may already have been applied with a 30-minute
-- target constraint. Keep targets positive, but let the UI choose the same
-- adaptive increment as daily durations.
alter table public.habits
  drop constraint if exists habits_duration_per_week_target_check;
alter table public.habits
  add constraint habits_duration_per_week_target_check
  check (frequency_type <> 'duration_per_week' or target_value > 0);
