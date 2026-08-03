-- Categories now start at level 0. A scoring_config row N is the cost to
-- reach category level N, so row 1 (50 points) promotes 0 -> 1.
alter table public.category_progress
  drop constraint if exists category_progress_current_level_check;

alter table public.category_progress
  alter column current_level set default 0,
  add constraint category_progress_current_level_check check (current_level between 0 and 5);
