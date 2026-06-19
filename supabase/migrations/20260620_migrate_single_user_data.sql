-- Réassigne les données du placeholder vers le compte Google réel.
-- À exécuter APRÈS la première connexion. Idempotent.
do $$
declare target uuid;
begin
  select id into target from auth.users where email = 'vaquez.v@gmail.com';
  if target is null then
    raise exception 'Compte vaquez.v@gmail.com introuvable : connecte-toi d''abord via Google.';
  end if;

  update public.checkins   set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  update public.habits     set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  update public.habit_logs set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  -- domain_scores suit automatiquement via checkin_id (pas de colonne user_id propre).

  raise notice 'Migration terminée vers %', target;
end $$;
