-- Seed data for preset habits
-- This file populates preset_habits and preset_badges with initial data

-- Sommeil (Sleep)
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Sommeil', 'self_care', 'debutant', '😴', 'per_day', 1, 8 * 60, 10 * 60, 11 * 60, true, true, true, false, false),
  ('Sommeil', 'self_care', 'intermediaire', '😴', 'per_day', 1, 8 * 60, 9 * 60, 10 * 60, true, true, true, false, false),
  ('Sommeil', 'self_care', 'expert', '😴', 'per_day', 1, 5 * 60, 7 * 60, 510, true, true, true, false, false),
  ('Sommeil', 'self_care', 'expert', '😴', 'per_day', 1, 6 * 60, 8 * 60, 9 * 60, true, true, true, false, false);

-- Badges for Sommeil - Enfant
insert into public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
select id, 1, 1, 'Première nuit complète', '🌙' from public.preset_habits where name = 'Sommeil' and expertise = 'debutant'
union all
select id, 3, 3, 'Trois nuits', '🌙🌙🌙' from public.preset_habits where name = 'Sommeil' and expertise = 'debutant'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Sommeil' and expertise = 'debutant'
union all
select id, 10, 10, 'Dix nuits', '🎉' from public.preset_habits where name = 'Sommeil' and expertise = 'debutant'
union all
-- Badges for Sommeil - Intermédiaire
select id, 1, 1, 'Première nuit complète', '🌙' from public.preset_habits where name = 'Sommeil' and expertise = 'intermediaire'
union all
select id, 3, 3, 'Trois nuits', '🌙🌙🌙' from public.preset_habits where name = 'Sommeil' and expertise = 'intermediaire'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Sommeil' and expertise = 'intermediaire'
union all
select id, 10, 10, 'Dix nuits', '🎉' from public.preset_habits where name = 'Sommeil' and expertise = 'intermediaire'
union all
-- Badges for Sommeil - Expert (male and female variants)
select id, 1, 1, 'Première nuit complète', '🌙' from public.preset_habits where name = 'Sommeil' and expertise = 'expert'
union all
select id, 3, 3, 'Trois nuits', '🌙🌙🌙' from public.preset_habits where name = 'Sommeil' and expertise = 'expert'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Sommeil' and expertise = 'expert'
union all
select id, 10, 10, 'Dix nuits', '🎉' from public.preset_habits where name = 'Sommeil' and expertise = 'expert';
