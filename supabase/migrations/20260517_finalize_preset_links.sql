-- Finalize preset migration:
-- - create missing Enfants preset
-- - align habits to the correct preset_habit reference
-- - backfill habit_logs.preset_habit_id
-- - fill max_value from preset when missing

insert into public.preset_habits (
  name,
  category,
  expertise,
  emoji,
  frequency_type,
  frequency_value,
  min_value,
  target_value,
  max_value,
  editable_min_value,
  editable_target_value,
  editable_max_value,
  editable_frequency_type,
  editable_frequency_value
)
values (
  'Enfants',
  'vie_familiale',
  'standard',
  '🧒',
  'per_day',
  1,
  0,
  30,
  60,
  true,
  true,
  true,
  false,
  true
)
on conflict (name, expertise) do update set
  category = excluded.category,
  emoji = excluded.emoji,
  frequency_type = excluded.frequency_type,
  frequency_value = excluded.frequency_value,
  min_value = excluded.min_value,
  target_value = excluded.target_value,
  max_value = excluded.max_value,
  editable_min_value = excluded.editable_min_value,
  editable_target_value = excluded.editable_target_value,
  editable_max_value = excluded.editable_max_value,
  editable_frequency_type = excluded.editable_frequency_type,
  editable_frequency_value = excluded.editable_frequency_value;

insert into public.preset_badges (
  preset_habit_id,
  badge_level,
  consecutive_days,
  badge_name,
  badge_emoji
)
select id, 1, 1, 'Premier moment', '🧒'
from public.preset_habits
where name = 'Enfants' and expertise = 'standard'
on conflict (preset_habit_id, badge_level) do update set
  consecutive_days = excluded.consecutive_days,
  badge_name = excluded.badge_name,
  badge_emoji = excluded.badge_emoji;

insert into public.preset_badges (
  preset_habit_id,
  badge_level,
  consecutive_days,
  badge_name,
  badge_emoji
)
select id, 3, 3, 'Trois moments', '🧒🧒🧒'
from public.preset_habits
where name = 'Enfants' and expertise = 'standard'
on conflict (preset_habit_id, badge_level) do update set
  consecutive_days = excluded.consecutive_days,
  badge_name = excluded.badge_name,
  badge_emoji = excluded.badge_emoji;

insert into public.preset_badges (
  preset_habit_id,
  badge_level,
  consecutive_days,
  badge_name,
  badge_emoji
)
select id, 7, 7, 'Une semaine', '📅'
from public.preset_habits
where name = 'Enfants' and expertise = 'standard'
on conflict (preset_habit_id, badge_level) do update set
  consecutive_days = excluded.consecutive_days,
  badge_name = excluded.badge_name,
  badge_emoji = excluded.badge_emoji;

insert into public.preset_badges (
  preset_habit_id,
  badge_level,
  consecutive_days,
  badge_name,
  badge_emoji
)
select id, 10, 10, 'Dix moments', '🎉'
from public.preset_habits
where name = 'Enfants' and expertise = 'standard'
on conflict (preset_habit_id, badge_level) do update set
  consecutive_days = excluded.consecutive_days,
  badge_name = excluded.badge_name,
  badge_emoji = excluded.badge_emoji;

with mapping as (
  select 'Dents'::text as habit_name, 'Dents'::text as preset_name, 'standard'::text as expertise
  union all select 'Douche', 'Douche', 'standard'
  union all select 'Sommeil', 'Sommeil', 'adulte_homme'
  union all select 'Violon', 'Musique', 'intermediaire'
  union all select 'Chien', 'Chien', 'standard'
  union all select 'Femme', 'Massage Partenaire', 'standard'
  union all select 'Enfants', 'Enfants', 'standard'
)
update public.habits h
set
  preset_habit_id = ph.id,
  max_value = coalesce(h.max_value, ph.max_value)
from mapping m
join public.preset_habits ph
  on ph.name = m.preset_name
 and ph.expertise = m.expertise
where h.name = m.habit_name
  and (
    h.preset_habit_id is distinct from ph.id
    or h.max_value is null
  );

update public.habit_logs hl
set preset_habit_id = h.preset_habit_id
from public.habits h
where hl.habit_id = h.id
  and h.preset_habit_id is not null
  and hl.preset_habit_id is distinct from h.preset_habit_id;
