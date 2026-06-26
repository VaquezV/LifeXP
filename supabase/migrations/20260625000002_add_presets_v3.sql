-- Migration: Presets V3 — Beauté, Méditation, Lecture, Câlin, Temps ensemble, Appeler, Devoir, Études, LinkedIn
-- Idempotente via ON CONFLICT (name, expertise) DO UPDATE SET.

INSERT INTO public.preset_habits
  (name, category, expertise, emoji, frequency_type, frequency_value, min_value, target_value, max_value,
   editable_min_value, editable_target_value, editable_max_value, editable_frequency_type, editable_frequency_value)
VALUES
  -- self_care : Routine beauté
  ('Soin',       'self_care', 'Routine beauté', '🧴', 'times_per_day',  1, 0, 1, 1, false, false, false, false, false),

  -- self_care : Méditation
  ('Méditation', 'self_care', '15min',          '🧘', 'per_day',        1, 10, 15, 30, true, true, true, false, false),
  ('Méditation', 'self_care', '30min',          '🧘', 'per_day',        1, 15, 30, 60, true, true, true, false, false),

  -- dev_perso : Lecture
  ('Lecture', 'dev_perso', 'Roman 10min',        '📚', 'per_day', 1,  5, 10, 30, true, true, true, false, false),
  ('Lecture', 'dev_perso', 'Roman 30min',        '📚', 'per_day', 1, 15, 30, 60, true, true, true, false, false),
  ('Lecture', 'dev_perso', 'Développement 10min','📖', 'per_day', 1,  5, 10, 30, true, true, true, false, false),
  ('Lecture', 'dev_perso', 'Développement 30min','📖', 'per_day', 1, 15, 30, 60, true, true, true, false, false),

  -- vie_familiale : Câlin
  ('Câlin',           'vie_familiale', '1/jour',    '🤗', 'times_per_day',  1, 0, 1, 3, false, true, true, false, false),
  ('Câlin',           'vie_familiale', '3/jour',    '🤗', 'times_per_day',  3, 1, 3, 5, false, true, true, false, false),

  -- vie_familiale : Temps ensemble
  ('Temps ensemble',  'vie_familiale', 'standard',  '🫂', 'per_day',        1, 15, 30, 60, true, true, true, false, false),

  -- vie_familiale : Appeler un proche
  ('Appeler un proche', 'vie_familiale', '1/jour',     '📞', 'times_per_day',  1, 0, 1, 2, false, true, true, false, false),
  ('Appeler un proche', 'vie_familiale', '3/semaine',  '📞', 'times_per_week', 3, 1, 3, 5, false, true, true, false, false),

  -- vie_pro : Devoir
  ('Devoir', 'vie_pro', 'École',  '📝', 'per_day', 1, 10, 15,  30, true, true, true, false, false),
  ('Devoir', 'vie_pro', 'Collège','📝', 'per_day', 1, 20, 30,  60, true, true, true, false, false),
  ('Devoir', 'vie_pro', 'Lycée',  '📝', 'per_day', 1, 45, 60,  90, true, true, true, false, false),

  -- vie_pro : Études
  ('Études', 'vie_pro', '30min', '🎓', 'per_day', 1, 20, 30,  60, true, true, true, false, false),
  ('Études', 'vie_pro', '1h',    '🎓', 'per_day', 1, 45, 60,  90, true, true, true, false, false),

  -- vie_pro : LinkedIn
  ('LinkedIn', 'vie_pro', 'Commentaire 1/jour', '💼', 'times_per_day',  1, 0, 1, 3, false, true, true, false, false),
  ('LinkedIn', 'vie_pro', 'Commentaire 3/sem',  '💼', 'times_per_week', 3, 1, 3, 5, false, true, true, false, false),
  ('LinkedIn', 'vie_pro', 'Post 1/jour',        '💼', 'times_per_day',  1, 0, 1, 1, false, false, false, false, false),
  ('LinkedIn', 'vie_pro', 'Post 1/sem',         '💼', 'times_per_week', 1, 0, 1, 2, false, true, false, false, false)

ON CONFLICT (name, expertise) DO UPDATE SET
  category              = EXCLUDED.category,
  emoji                 = EXCLUDED.emoji,
  frequency_type        = EXCLUDED.frequency_type,
  frequency_value       = EXCLUDED.frequency_value,
  min_value             = EXCLUDED.min_value,
  target_value          = EXCLUDED.target_value,
  max_value             = EXCLUDED.max_value,
  editable_min_value    = EXCLUDED.editable_min_value,
  editable_target_value = EXCLUDED.editable_target_value,
  editable_max_value    = EXCLUDED.editable_max_value,
  editable_frequency_type  = EXCLUDED.editable_frequency_type,
  editable_frequency_value = EXCLUDED.editable_frequency_value;
