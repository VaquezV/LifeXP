-- Réassigne les données du placeholder vers le compte Google réel.
-- À exécuter APRÈS la première connexion. Idempotent : un doublon laissé par une
-- exécution précédente (même user_id+name pour habits, même user_id+date pour
-- checkins) est supprimé plutôt que réassigné, pour ne pas violer les contraintes
-- uniques habits_user_name_unique / checkins_user_date_unique. Les enfants
-- (habit_logs, domain_scores) suivent automatiquement via ON DELETE CASCADE.
do $$
declare target uuid;
begin
  select id into target from auth.users where email = 'vaquez.v@gmail.com';
  if target is null then
    raise exception 'Compte vaquez.v@gmail.com introuvable : connecte-toi d''abord via Google.';
  end if;

  delete from public.checkins
  where user_id = '00000000-0000-0000-0000-000000000000'
    and date in (select date from public.checkins where user_id = target);
  update public.checkins set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';

  delete from public.habits
  where user_id = '00000000-0000-0000-0000-000000000000'
    and name in (select name from public.habits where user_id = target);
  update public.habits set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';

  update public.habit_logs set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  -- domain_scores suit automatiquement via checkin_id (pas de colonne user_id propre).

  raise notice 'Migration terminée vers %', target;
end $$;
