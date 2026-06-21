-- Seed data for preset habits — V2
-- Fresh setup: reflects the desired final state after all migrations
-- NOTE: La migration 20260621_update_presets_v2.sql a supprimé le CHECK constraint
-- sur expertise, donc les valeurs libres sont acceptées.

-- Sommeil (inchangé)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Sommeil', 'self_care', 'enfant',       '😴', 'per_day', 1, 480, 600, 660, true, true, true, false, false),
  ('Sommeil', 'self_care', 'ado',          '😴', 'per_day', 1, 480, 540, 600, true, true, true, false, false),
  ('Sommeil', 'self_care', 'adulte_homme', '😴', 'per_day', 1, 300, 420, 510, true, true, true, false, false),
  ('Sommeil', 'self_care', 'adulte_femme', '😴', 'per_day', 1, 360, 480, 540, true, true, true, false, false);

-- Soin (ex Dents + Douche, + Rasage)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Soin', 'self_care', 'Dents',            '🪥', 'times_per_day',  2, 1, 2, 3, false, true,  true,  false, false),
  ('Soin', 'self_care', 'Douche',           '🚿', 'times_per_week', 1, 3, 5, 7, true,  true,  true,  false, false),
  ('Soin', 'self_care', 'Rasage quotidien', '🪒', 'times_per_day',  1, 0, 1, 1, false, false, false, false, false),
  ('Soin', 'self_care', 'Rasage bi-hebdo',  '🪒', 'times_per_week', 1, 0, 2, 3, false, true,  false, false, false);

-- Traitement (nouveau)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Traitement', 'self_care', '1x/jour',    '💊', 'times_per_day',  1, 1, 1, 3, false, false, false, false, false),
  ('Traitement', 'self_care', '2x/jour',    '💊', 'times_per_day',  2, 1, 2, 3, false, false, false, false, false),
  ('Traitement', 'self_care', '3x/jour',    '💊', 'times_per_day',  3, 2, 3, 4, false, false, false, false, false),
  ('Traitement', 'self_care', '1x/semaine', '💊', 'times_per_week', 1, 1, 1, 2, false, false, false, false, false);

-- Instrument (ex Musique)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Instrument', 'dev_perso', 'debutant',      '🎻', 'per_day', 1, 10, 15, 30, true, true, true, false, true),
  ('Instrument', 'dev_perso', 'intermediaire', '🎻', 'per_day', 1, 15, 30, 60, true, true, true, false, true),
  ('Instrument', 'dev_perso', 'expert',        '🎻', 'per_day', 1, 30, 60, 90, true, true, true, false, true);

-- Solfège (nouveau)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Solfège', 'dev_perso', 'standard', '🎵', 'per_day', 1, 5, 10, 20, true, true, true, false, true);

-- Activité (nouveau — dev_perso)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Activité', 'dev_perso', 'Marche',  '🚶', 'per_day',        1, 8000, 10000, 12000, true, true, true, false, false),
  ('Activité', 'dev_perso', 'Courses', '🏃', 'times_per_week', 1, 1,  3,  5,  true,  true,  true,  false, false),
  ('Activité', 'dev_perso', 'Sport',   '⚽', 'per_day',        1, 15, 30, 60, true,  true,  true,  false, false);

-- Chien (vie_familiale)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Chien', 'vie_familiale', 'Balade',            '🐕', 'per_day',        1, 30, 60, 90, true,  true,  true,  false, true),
  ('Chien', 'vie_familiale', 'Brossage quotidien', '🐕', 'times_per_day',  1, 0,  1,  1,  false, false, false, false, false),
  ('Chien', 'vie_familiale', 'Brossage hebdo',     '🐕', 'times_per_week', 1, 0,  1,  2,  false, true,  false, false, false);

-- Massage Partenaire (inchangé)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Massage Partenaire', 'vie_familiale', 'standard', '💆', 'times_per_week', 1, 2, 3, 4, true, true, true, false, true);

-- Enfants (inchangé)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Enfants', 'vie_familiale', 'standard', '🧒', 'per_day', 1, 0, 30, 60, true, true, true, false, true);

-- Recettes (inchangé)
INSERT INTO public.preset_habits (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value, editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Recettes', 'vie_familiale', 'standard', '🍳', 'times_per_week', 1, 3, 5, 8, true, true, true, false, true);

-- ============================================================
-- BADGES
-- ============================================================

-- Badges Sommeil
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Première nuit complète', '🌙'     FROM public.preset_habits WHERE name = 'Sommeil'
UNION ALL
SELECT id, 3,  3,  'Trois nuits',            '🌙🌙🌙' FROM public.preset_habits WHERE name = 'Sommeil'
UNION ALL
SELECT id, 7,  7,  'Une semaine',            '📅'     FROM public.preset_habits WHERE name = 'Sommeil'
UNION ALL
SELECT id, 30, 30, 'Un mois',                '🎉'     FROM public.preset_habits WHERE name = 'Sommeil'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Soin
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Premier jour', '✨' FROM public.preset_habits WHERE name = 'Soin'
UNION ALL
SELECT id, 7,  7,  'Une semaine',  '📅' FROM public.preset_habits WHERE name = 'Soin'
UNION ALL
SELECT id, 30, 30, 'Un mois',      '🎉' FROM public.preset_habits WHERE name = 'Soin'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Traitement
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Premier jour', '💊' FROM public.preset_habits WHERE name = 'Traitement'
UNION ALL
SELECT id, 7,  7,  'Une semaine',  '📅' FROM public.preset_habits WHERE name = 'Traitement'
UNION ALL
SELECT id, 30, 30, 'Un mois',      '🎉' FROM public.preset_habits WHERE name = 'Traitement'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Instrument
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Première session',        '🎵' FROM public.preset_habits WHERE name = 'Instrument'
UNION ALL
SELECT id, 7,  7,  'Une semaine de pratique', '📅' FROM public.preset_habits WHERE name = 'Instrument'
UNION ALL
SELECT id, 30, 30, 'Un mois de pratique',     '🎉' FROM public.preset_habits WHERE name = 'Instrument'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Solfège
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Première session', '🎵' FROM public.preset_habits WHERE name = 'Solfège'
UNION ALL
SELECT id, 7,  7,  'Une semaine',      '📅' FROM public.preset_habits WHERE name = 'Solfège'
UNION ALL
SELECT id, 30, 30, 'Un mois',          '🎉' FROM public.preset_habits WHERE name = 'Solfège'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Activité
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Premier effort',     '⚡' FROM public.preset_habits WHERE name = 'Activité'
UNION ALL
SELECT id, 7,  7,  'Une semaine active', '📅' FROM public.preset_habits WHERE name = 'Activité'
UNION ALL
SELECT id, 30, 30, 'Un mois actif',      '🎉' FROM public.preset_habits WHERE name = 'Activité'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Chien
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Premier soin', '🐕' FROM public.preset_habits WHERE name = 'Chien'
UNION ALL
SELECT id, 7,  7,  'Une semaine',  '📅' FROM public.preset_habits WHERE name = 'Chien'
UNION ALL
SELECT id, 30, 30, 'Un mois',      '🎉' FROM public.preset_habits WHERE name = 'Chien'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Massage Partenaire
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Premier massage', '💆' FROM public.preset_habits WHERE name = 'Massage Partenaire'
UNION ALL
SELECT id, 7,  7,  'Une semaine',     '📅' FROM public.preset_habits WHERE name = 'Massage Partenaire'
UNION ALL
SELECT id, 30, 30, 'Un mois',         '🎉' FROM public.preset_habits WHERE name = 'Massage Partenaire'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Enfants
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Premier moment', '🧒' FROM public.preset_habits WHERE name = 'Enfants'
UNION ALL
SELECT id, 7,  7,  'Une semaine',    '📅' FROM public.preset_habits WHERE name = 'Enfants'
UNION ALL
SELECT id, 30, 30, 'Un mois',        '🎉' FROM public.preset_habits WHERE name = 'Enfants'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;

-- Badges Recettes
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
SELECT id, 1,  1,  'Première recette', '🍳' FROM public.preset_habits WHERE name = 'Recettes'
UNION ALL
SELECT id, 7,  7,  'Une semaine',      '📅' FROM public.preset_habits WHERE name = 'Recettes'
UNION ALL
SELECT id, 30, 30, 'Un mois',          '🎉' FROM public.preset_habits WHERE name = 'Recettes'
ON CONFLICT (preset_habit_id, badge_level) DO NOTHING;
