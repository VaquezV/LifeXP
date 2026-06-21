-- Migration: Presets V2 — free-form expertise + restructuration
-- Idempotente : sûre à relancer même si partiellement appliquée.

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
  ('Solfège', 'dev_perso', 'standard', '🎵', 'per_day', 1, 5, 10, 20, true, true, true, false, true)
ON CONFLICT (name, expertise) DO UPDATE SET
  category = EXCLUDED.category, emoji = EXCLUDED.emoji,
  frequency_type = EXCLUDED.frequency_type, frequency_value = EXCLUDED.frequency_value,
  min_value = EXCLUDED.min_value, target_value = EXCLUDED.target_value, max_value = EXCLUDED.max_value,
  editable_min_value = EXCLUDED.editable_min_value, editable_target_value = EXCLUDED.editable_target_value,
  editable_max_value = EXCLUDED.editable_max_value, editable_frequency_type = EXCLUDED.editable_frequency_type,
  editable_frequency_value = EXCLUDED.editable_frequency_value;

-- 4. Chien : standard → Balade + ajout Brossage
UPDATE public.preset_habits SET expertise = 'Balade', min_value = 30
  WHERE name = 'Chien' AND expertise = 'standard';

INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Chien', 'vie_familiale', 'Brossage quotidien', '🐕', 'times_per_day', 1, 0, 1, 1, false, false, false, false, false),
  ('Chien', 'vie_familiale', 'Brossage hebdo',     '🐕', 'times_per_week', 1, 0, 1, 2, false, true,  false, false, false)
ON CONFLICT (name, expertise) DO UPDATE SET
  category = EXCLUDED.category, emoji = EXCLUDED.emoji,
  frequency_type = EXCLUDED.frequency_type, frequency_value = EXCLUDED.frequency_value,
  min_value = EXCLUDED.min_value, target_value = EXCLUDED.target_value, max_value = EXCLUDED.max_value,
  editable_min_value = EXCLUDED.editable_min_value, editable_target_value = EXCLUDED.editable_target_value,
  editable_max_value = EXCLUDED.editable_max_value, editable_frequency_type = EXCLUDED.editable_frequency_type,
  editable_frequency_value = EXCLUDED.editable_frequency_value;

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
  ('Soin', 'self_care', 'Rasage bi-hebdo',  '🪒', 'times_per_week', 1, 0, 2, 3, false, true,  false, false, false)
ON CONFLICT (name, expertise) DO UPDATE SET
  category = EXCLUDED.category, emoji = EXCLUDED.emoji,
  frequency_type = EXCLUDED.frequency_type, frequency_value = EXCLUDED.frequency_value,
  min_value = EXCLUDED.min_value, target_value = EXCLUDED.target_value, max_value = EXCLUDED.max_value,
  editable_min_value = EXCLUDED.editable_min_value, editable_target_value = EXCLUDED.editable_target_value,
  editable_max_value = EXCLUDED.editable_max_value, editable_frequency_type = EXCLUDED.editable_frequency_type,
  editable_frequency_value = EXCLUDED.editable_frequency_value;

-- 6. Nouveau : Traitement
INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Traitement', 'self_care', '1x/jour',    '💊', 'times_per_day',  1, 1, 1, 3, false, false, false, false, false),
  ('Traitement', 'self_care', '2x/jour',    '💊', 'times_per_day',  2, 1, 2, 3, false, false, false, false, false),
  ('Traitement', 'self_care', '3x/jour',    '💊', 'times_per_day',  3, 2, 3, 4, false, false, false, false, false),
  ('Traitement', 'self_care', '1x/semaine', '💊', 'times_per_week', 1, 1, 1, 2, false, false, false, false, false)
ON CONFLICT (name, expertise) DO UPDATE SET
  category = EXCLUDED.category, emoji = EXCLUDED.emoji,
  frequency_type = EXCLUDED.frequency_type, frequency_value = EXCLUDED.frequency_value,
  min_value = EXCLUDED.min_value, target_value = EXCLUDED.target_value, max_value = EXCLUDED.max_value,
  editable_min_value = EXCLUDED.editable_min_value, editable_target_value = EXCLUDED.editable_target_value,
  editable_max_value = EXCLUDED.editable_max_value, editable_frequency_type = EXCLUDED.editable_frequency_type,
  editable_frequency_value = EXCLUDED.editable_frequency_value;

-- 7. Nouveau : Activité (dev_perso)
-- DO UPDATE corrige aussi Marche si elle existait déjà en times_per_day/target=1 (ancienne version)
INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  ('Activité', 'dev_perso', 'Marche',  '🚶', 'per_day',        1, 8000, 10000, 12000, true, true, true, false, false),
  ('Activité', 'dev_perso', 'Courses', '🏃', 'times_per_week', 1, 1,    3,     5,     true, true, true, false, false),
  ('Activité', 'dev_perso', 'Sport',   '⚽', 'per_day',        1, 15,   30,    60,    true, true, true, false, false)
ON CONFLICT (name, expertise) DO UPDATE SET
  category = EXCLUDED.category, emoji = EXCLUDED.emoji,
  frequency_type = EXCLUDED.frequency_type, frequency_value = EXCLUDED.frequency_value,
  min_value = EXCLUDED.min_value, target_value = EXCLUDED.target_value, max_value = EXCLUDED.max_value,
  editable_min_value = EXCLUDED.editable_min_value, editable_target_value = EXCLUDED.editable_target_value,
  editable_max_value = EXCLUDED.editable_max_value, editable_frequency_type = EXCLUDED.editable_frequency_type,
  editable_frequency_value = EXCLUDED.editable_frequency_value;
