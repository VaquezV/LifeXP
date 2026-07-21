-- supabase/migrations/20260718_add_level_progression_validation.sql

-- Create a function to validate level progression
create or replace function public.validate_category_level_progression()
returns trigger as $$
begin
  -- Allow level progression only by +1 (or staying the same)
  -- Must first reach level 2 to reach level 3, etc.
  if new.current_level > old.current_level then
    if new.current_level > old.current_level + 1 then
      raise exception 'Category levels must progress sequentially: cannot jump from level % to level %', old.current_level, new.current_level;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- Apply the trigger to category_progress table
drop trigger if exists check_category_level_progression on public.category_progress;
create trigger check_category_level_progression
before update on public.category_progress
for each row
execute function public.validate_category_level_progression();
