-- supabase/migrations/20260816000003_category_level_decay.sql

-- Category levels can now decay by exactly one step when points_in_level goes
-- negative (see apply-daily-scoring). Extend the existing +1 guard to also
-- allow -1, while still blocking any jump of more than one level either way.
create or replace function public.validate_category_level_progression()
returns trigger as $$
begin
  if new.current_level != old.current_level then
    if abs(new.current_level - old.current_level) > 1 then
      raise exception 'Category levels must progress sequentially: cannot jump from level % to level %', old.current_level, new.current_level;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- Snapshot of current_level/points_in_level the last time the user dismissed
-- the accessory gain/loss modal for this category. Seeded to the current
-- values so existing rows don't trigger a false "gained" notification on
-- first load after this migration.
alter table public.category_progress
  add column if not exists last_seen_level int not null default 0,
  add column if not exists last_seen_points_in_level float not null default 0;

update public.category_progress
set last_seen_level = current_level,
    last_seen_points_in_level = points_in_level;
