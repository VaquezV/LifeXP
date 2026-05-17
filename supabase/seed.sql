-- Seed data for preset habits
-- This file populates preset_habits and preset_badges with initial data

-- Sommeil (Sleep)
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Sommeil', 'self_care', 'enfant', '😴', 'per_day', 1, 8 * 60, 10 * 60, 11 * 60, true, true, true, false, false),
  ('Sommeil', 'self_care', 'ado', '😴', 'per_day', 1, 8 * 60, 9 * 60, 10 * 60, true, true, true, false, false),
  ('Sommeil', 'self_care', 'adulte_homme', '😴', 'per_day', 1, 5 * 60, 7 * 60, 510, true, true, true, false, false),
  ('Sommeil', 'self_care', 'adulte_femme', '😴', 'per_day', 1, 6 * 60, 8 * 60, 9 * 60, true, true, true, false, false);

-- Badges for Sommeil - all expertise levels
insert into public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
select id, 1, 1, 'Première nuit complète', '🌙' from public.preset_habits where name = 'Sommeil'
union all
select id, 3, 3, 'Trois nuits', '🌙🌙🌙' from public.preset_habits where name = 'Sommeil'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Sommeil'
union all
select id, 10, 10, 'Dix nuits', '🎉' from public.preset_habits where name = 'Sommeil';

-- Musique (Music/Violin)
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Musique', 'dev_perso', 'debutant', '🎻', 'per_day', 1, 10, 15, 30, true, true, true, false, true),
  ('Musique', 'dev_perso', 'intermediaire', '🎻', 'per_day', 1, 15, 30, 60, true, true, true, false, true),
  ('Musique', 'dev_perso', 'expert', '🎻', 'per_day', 1, 30, 60, 90, true, true, true, false, true);

-- Badges for Musique - all expertise levels
insert into public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
select id, 1, 1, 'Première session', '🎵' from public.preset_habits where name = 'Musique'
union all
select id, 3, 3, 'Trois sessions', '🎵🎵🎵' from public.preset_habits where name = 'Musique'
union all
select id, 7, 7, 'Une semaine de pratique', '📅' from public.preset_habits where name = 'Musique'
union all
select id, 10, 10, 'Dix sessions', '🎉' from public.preset_habits where name = 'Musique';

-- Dents (Teeth Brushing)
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Dents', 'self_care', 'standard', '🪥', 'times_per_day', 2, 1, 2, 3, false, true, true, false, false);

-- Douche (Shower)
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Douche', 'self_care', 'standard', '🚿', 'times_per_week', 3, 3, 3, 5, true, true, true, true, true);

-- Chien (Dog Care)
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Chien', 'vie_familiale', 'standard', '🐕', 'per_day', 1, 40, 60, 90, true, true, true, false, true);

-- Massage Partenaire (Partner Massage)
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Massage Partenaire', 'vie_familiale', 'standard', '💆', 'times_per_week', 3, 2, 3, 4, true, true, true, false, true);

-- Enfants
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Enfants', 'vie_familiale', 'standard', '🧒', 'per_day', 1, 0, 30, 60, true, true, true, false, true);

-- Recettes (Recipes)
insert into public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
values
  ('Recettes', 'vie_familiale', 'standard', '🍳', 'times_per_week', 5, 3, 5, 8, true, true, true, false, true);

-- Badges for Dents
insert into public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
select id, 1, 1, 'Premiers brossages', '🪥' from public.preset_habits where name = 'Dents' and expertise = 'standard'
union all
select id, 3, 3, 'Trois jours', '🪥🪥🪥' from public.preset_habits where name = 'Dents' and expertise = 'standard'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Dents' and expertise = 'standard'
union all
select id, 10, 10, 'Dix jours', '🎉' from public.preset_habits where name = 'Dents' and expertise = 'standard'
union all
-- Badges for Douche
select id, 1, 1, 'Première douche', '🚿' from public.preset_habits where name = 'Douche' and expertise = 'standard'
union all
select id, 3, 3, 'Trois douches', '🚿🚿🚿' from public.preset_habits where name = 'Douche' and expertise = 'standard'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Douche' and expertise = 'standard'
union all
select id, 10, 10, 'Dix jours', '🎉' from public.preset_habits where name = 'Douche' and expertise = 'standard'
union all
-- Badges for Chien
select id, 1, 1, 'Premier soin du chien', '🐕' from public.preset_habits where name = 'Chien' and expertise = 'standard'
union all
select id, 3, 3, 'Trois soins', '🐕🐕🐕' from public.preset_habits where name = 'Chien' and expertise = 'standard'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Chien' and expertise = 'standard'
union all
select id, 10, 10, 'Dix jours', '🎉' from public.preset_habits where name = 'Chien' and expertise = 'standard'
union all
-- Badges for Massage Partenaire
select id, 1, 1, 'Premier massage', '💆' from public.preset_habits where name = 'Massage Partenaire' and expertise = 'standard'
union all
select id, 3, 3, 'Trois massages', '💆💆💆' from public.preset_habits where name = 'Massage Partenaire' and expertise = 'standard'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Massage Partenaire' and expertise = 'standard'
union all
select id, 10, 10, 'Dix jours', '🎉' from public.preset_habits where name = 'Massage Partenaire' and expertise = 'standard'
union all
-- Badges for Enfants
select id, 1, 1, 'Premier moment', '🧒' from public.preset_habits where name = 'Enfants' and expertise = 'standard'
union all
select id, 3, 3, 'Trois moments', '🧒🧒🧒' from public.preset_habits where name = 'Enfants' and expertise = 'standard'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Enfants' and expertise = 'standard'
union all
select id, 10, 10, 'Dix moments', '🎉' from public.preset_habits where name = 'Enfants' and expertise = 'standard'
union all
-- Badges for Recettes
select id, 1, 1, 'Première recette', '🍳' from public.preset_habits where name = 'Recettes' and expertise = 'standard'
union all
select id, 3, 3, 'Trois recettes', '🍳🍳🍳' from public.preset_habits where name = 'Recettes' and expertise = 'standard'
union all
select id, 7, 7, 'Une semaine', '📅' from public.preset_habits where name = 'Recettes' and expertise = 'standard'
union all
select id, 10, 10, 'Dix jours', '🎉' from public.preset_habits where name = 'Recettes' and expertise = 'standard';
