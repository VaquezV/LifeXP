-- Corrige un écart entre les policies RLS déclarées dans 20260620_enable_rls.sql et l'état
-- réel de la base live : un test d'intégration (lib/supabase.integration.test.ts, "SELECT
-- habits sans auth retourne 0 lignes") a montré qu'un SELECT avec la clé anon (sans session
-- authentifiée) retournait des lignes sur `habits`. Un dump du schéma live a confirmé la
-- cause : les anciennes policies permissives `open_*_policy` (USING true, WITH CHECK true,
-- accordées à authenticated ET anon) sont toujours présentes en plus des policies restrictives
-- attendues, sur habits/checkins/habit_logs/domain_scores/preset_habits/preset_badges. Les
-- policies RLS Postgres s'additionnant (OR logique), leur présence annule la protection —
-- pas seulement pour anon, mais aussi entre utilisateurs authenticated (chacun peut voir/
-- modifier les données des autres).
--
-- Idempotent : supprime TOUTE policy existante sur ces tables, quel que soit son nom (pas
-- seulement `open_%s_policy`), avant de ré-appliquer exactement les policies attendues
-- telles que définies dans 20260620_enable_rls.sql. `force row level security` empêche en
-- plus le propriétaire de la table de contourner la RLS.

do $$
declare
  t text;
  pol record;
begin
  -- user_id = auth.uid() : accès strictement limité au propriétaire de la ligne.
  foreach t in array array['checkins', 'habits', 'habit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);

    for pol in
      select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;

    execute format('create policy %s_select on public.%I for select to authenticated using (auth.uid() = user_id)', t, t);
    execute format('create policy %s_insert on public.%I for insert to authenticated with check (auth.uid() = user_id)', t, t);
    execute format('create policy %s_update on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy %s_delete on public.%I for delete to authenticated using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- domain_scores : pas de user_id direct, appartenance via le checkin parent.
do $$
declare
  pol record;
begin
  alter table public.domain_scores enable row level security;
  alter table public.domain_scores force row level security;

  for pol in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'domain_scores'
  loop
    execute format('drop policy if exists %I on public.domain_scores', pol.policyname);
  end loop;

  create policy domain_scores_select on public.domain_scores for select to authenticated
    using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
  create policy domain_scores_insert on public.domain_scores for insert to authenticated
    with check (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
  create policy domain_scores_update on public.domain_scores for update to authenticated
    using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()))
    with check (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
  create policy domain_scores_delete on public.domain_scores for delete to authenticated
    using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
end $$;

-- preset_habits / preset_badges : catalogue de référence, lecture seule pour authenticated
-- (aucune policy insert/update/delete : gérées uniquement via service_role).
do $$
declare
  t text;
  pol record;
begin
  foreach t in array array['preset_habits', 'preset_badges'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);

    for pol in
      select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;

    execute format('create policy %s_select on public.%I for select to authenticated using (true)', t, t);
  end loop;
end $$;
