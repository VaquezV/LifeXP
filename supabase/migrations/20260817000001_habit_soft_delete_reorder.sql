-- Soft-delete + reorder support for habits, plus a daily log-retention purge
-- (60 days for deactivated habits, active_habit_history_days() for active ones,
-- kept in sync with the dashboard's visible history window).
alter table public.habits add column if not exists is_active boolean not null default true;
alter table public.habits add column if not exists position integer not null default 0;

with ranked as (
  select id, row_number() over (partition by user_id, category order by created_at) - 1 as rn
  from public.habits
)
update public.habits h set position = ranked.rn
from ranked where ranked.id = h.id;

alter table public.habits drop constraint if exists habits_user_name_unique;
create unique index if not exists habits_user_name_active_unique
  on public.habits (user_id, name) where is_active;

create or replace function public.active_habit_history_days() returns integer
  language sql immutable as $$ select 205 $$;

create or replace function public.purge_old_habit_logs() returns void
  language plpgsql security definer as $$
begin
  delete from public.habit_logs hl
  using public.habits h
  where hl.habit_id = h.id
    and h.is_active = false
    and hl.date < (current_date - interval '60 days');

  delete from public.habit_logs hl
  using public.habits h
  where hl.habit_id = h.id
    and h.is_active = true
    and hl.date < (current_date - (public.active_habit_history_days() || ' days')::interval);
end;
$$;

-- pg_cron scheduling is NOT done here (same convention as apply-daily-scoring):
-- registering a cron.job from a migration would duplicate/fail across environments
-- (local reset, branches). Run once against the linked project after this migration:
--   select cron.schedule('purge-old-habit-logs', '0 1 * * *',
--     $$select public.purge_old_habit_logs();$$);
