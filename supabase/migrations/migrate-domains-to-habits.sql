-- lifexp/supabase/migrations/migrate-domains-to-habits.sql
-- Migrate 7 fixed domains to new habits table with categories
-- Run this ONCE after deploying new schema

-- Insert habits for the 7 existing domains
insert into public.habits
  (user_id, category, name, emoji, frequency_type, frequency_value, min_value, target_value)
values
  ('00000000-0000-0000-0000-000000000000', 'self_care', 'Dents', '🪥', 'times_per_day', 2, 0, 2),
  ('00000000-0000-0000-0000-000000000000', 'self_care', 'Douche', '🚿', 'times_per_week', 3, 0, 3),
  ('00000000-0000-0000-0000-000000000000', 'self_care', 'Sommeil', '😴', 'per_day', 1, 300, 420),
  ('00000000-0000-0000-0000-000000000000', 'dev_perso', 'Violon', '🎻', 'per_day', 1, 0, 15),
  ('00000000-0000-0000-0000-000000000000', 'vie_familiale', 'Enfants', '🧒', 'per_day', 1, 0, 30),
  ('00000000-0000-0000-0000-000000000000', 'vie_familiale', 'Chien', '🐕', 'per_day', 1, 30, 60),
  ('00000000-0000-0000-0000-000000000000', 'vie_familiale', 'Femme', '💆', 'times_per_week', 3, 0, 3)
on conflict (user_id, name) do nothing;

-- TODO: Migrate data from old checkins + domain_scores to habit_logs
-- This requires mapping domain keys to habit IDs, which depends on actual user_id in use
-- For now, start fresh with habit_logs. Old data can be kept in old tables for reference.
