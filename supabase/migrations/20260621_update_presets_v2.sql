-- Migration: Presets V2 — free-form expertise + restructuration

-- 1. Supprimer le CHECK constraint sur expertise pour permettre des valeurs libres
ALTER TABLE public.preset_habits
  DROP CONSTRAINT IF EXISTS preset_habits_expertise_check;

-- 2. Musique → Instrument (renommage du name uniquement, expertise inchangée)
UPDATE public.preset_habits SET name = 'Instrument' WHERE name = 'Musique';

-- 3. Ajouter Solfège
INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Solfège', 'dev_perso', 'standard', '🎵', 'per_day', 1, 5, 10, 20, true, true, true, false, true);

-- 4. Chien : standard → Balade + ajout Brossage
UPDATE public.preset_habits SET expertise = 'Balade', min_value = 30
  WHERE name = 'Chien' AND expertise = 'standard';

INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Chien', 'vie_familiale', 'Brossage quotidien', '🐕', 'times_per_day', 1, 0, 1, 1, false, false, false, false, false),
  ('Chien', 'vie_familiale', 'Brossage hebdo',     '🐕', 'times_per_week', 1, 0, 1, 2, false, true,  false, false, false);

-- 5. Dents + Douche → Soin (rename name + rename expertise)
UPDATE public.preset_habits SET name = 'Soin', expertise = 'Dents'
  WHERE name = 'Dents' AND expertise = 'standard';

UPDATE public.preset_habits SET name = 'Soin', expertise = 'Douche', min_value = 3, target_value = 5, max_value = 7
  WHERE name = 'Douche' AND expertise = 'standard';

INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Soin', 'self_care', 'Rasage quotidien', '🪒', 'times_per_day',  1, 0, 1, 1, false, false, false, false, false),
  ('Soin', 'self_care', 'Rasage bi-hebdo',  '🪒', 'times_per_week', 1, 0, 2, 3, false, true,  false, false, false);

-- 6. Nouveau : Traitement
INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Traitement', 'self_care', '1x/jour',     '💊', 'times_per_day',  1, 1, 1, 3, false, false, false, false, false),
  ('Traitement', 'self_care', '2x/jour',     '💊', 'times_per_day',  2, 1, 2, 3, false, false, false, false, false),
  ('Traitement', 'self_care', '3x/jour',     '💊', 'times_per_day',  3, 2, 3, 4, false, false, false, false, false),
  ('Traitement', 'self_care', '1x/semaine',  '💊', 'times_per_week', 1, 1, 1, 2, false, false, false, false, false);

-- 7. Nouveau : Activité (dev_perso)
INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Activité', 'dev_perso', 'Marche',  '🚶', 'times_per_day',  1, 0, 1,  1,  false, false, false, false, false),
  ('Activité', 'dev_perso', 'Courses', '🏃', 'times_per_week', 1, 1, 3,  5,  true,  true,  true,  false, false),
  ('Activité', 'dev_perso', 'Sport',   '⚽', 'per_day',        1, 15, 30, 60, true,  true,  true,  false, false);

-- 8. Badges pour les nouveaux presets
INSERT INTO public.preset_badges (preset_habit_id, badge_level, consecutive_days, badge_name, badge_emoji)
-- Solfège
SELECT id, 1,  1,  'Première session',    '🎵' FROM public.preset_habits WHERE name = 'Solfège'
UNION ALL
SELECT id, 7,  7,  'Une semaine',         '📅' FROM public.preset_habits WHERE name = 'Solfège'
UNION ALL
SELECT id, 30, 30, 'Un mois',             '🎉' FROM public.preset_habits WHERE name = 'Solfège'
UNION ALL
-- Chien Brossage
SELECT id, 1,  1,  'Premier brossage',    '🐕' FROM public.preset_habits WHERE name = 'Chien' AND expertise IN ('Brossage quotidien', 'Brossage hebdo')
UNION ALL
SELECT id, 7,  7,  'Une semaine',         '📅' FROM public.preset_habits WHERE name = 'Chien' AND expertise IN ('Brossage quotidien', 'Brossage hebdo')
UNION ALL
-- Soin (nouveaux items)
SELECT id, 1,  1,  'Premier jour',        '🪒' FROM public.preset_habits WHERE name = 'Soin' AND expertise IN ('Rasage quotidien', 'Rasage bi-hebdo')
UNION ALL
SELECT id, 7,  7,  'Une semaine',         '📅' FROM public.preset_habits WHERE name = 'Soin' AND expertise IN ('Rasage quotidien', 'Rasage bi-hebdo')
UNION ALL
-- Traitement
SELECT id, 1,  1,  'Premier jour',        '💊' FROM public.preset_habits WHERE name = 'Traitement'
UNION ALL
SELECT id, 7,  7,  'Une semaine',         '📅' FROM public.preset_habits WHERE name = 'Traitement'
UNION ALL
SELECT id, 30, 30, 'Un mois',             '🎉' FROM public.preset_habits WHERE name = 'Traitement'
UNION ALL
-- Activité
SELECT id, 1,  1,  'Premier effort',      '⚡' FROM public.preset_habits WHERE name = 'Activité'
UNION ALL
SELECT id, 7,  7,  'Une semaine active',  '📅' FROM public.preset_habits WHERE name = 'Activité'
UNION ALL
SELECT id, 30, 30, 'Un mois actif',       '🎉' FROM public.preset_habits WHERE name = 'Activité';
