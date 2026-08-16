-- Atomically remove only the current user's habits/history and restore the
-- Sanctuary progression to its initial state. Check-ins and domain scores are
-- intentionally retained because they are outside this reset's scope.
create or replace function public.reset_sanctuary()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  reset_user_id uuid := auth.uid();
begin
  if reset_user_id is null then
    raise exception 'Authentication is required to reset the Sanctuary';
  end if;

  delete from public.habit_logs where user_id = reset_user_id;
  delete from public.habits where user_id = reset_user_id;

  insert into public.category_progress (
    user_id,
    category,
    current_level,
    points_in_level,
    last_maintenance_date,
    updated_at
  )
  select reset_user_id, category, 0, 0, null, now()
  from unnest(array['self_care', 'dev_perso', 'vie_familiale', 'vie_pro']) as categories(category)
  on conflict (user_id, category) do update
  set current_level = 0,
      points_in_level = 0,
      last_maintenance_date = null,
      updated_at = excluded.updated_at;

  insert into public.user_palette_progression (
    user_id,
    current_wolf_level,
    last_seen_wolf_level,
    transition_date
  )
  values (reset_user_id, 1, 1, now())
  on conflict (user_id) do update
  set current_wolf_level = 1,
      last_seen_wolf_level = 1,
      transition_date = excluded.transition_date;
end;
$$;

revoke all on function public.reset_sanctuary() from public;
grant execute on function public.reset_sanctuary() to authenticated;
