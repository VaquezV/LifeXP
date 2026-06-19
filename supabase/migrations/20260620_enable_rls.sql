-- Active RLS par utilisateur sur les tables de données et restreint les presets.

-- checkins / habits / habit_logs : user_id = auth.uid()
do $$
declare t text;
begin
  foreach t in array array['checkins', 'habits', 'habit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
    execute format('drop policy if exists open_%s_policy on public.%I', t, t);
    execute format('create policy %s_select on public.%I for select to authenticated using (auth.uid() = user_id)', t, t);
    execute format('create policy %s_insert on public.%I for insert to authenticated with check (auth.uid() = user_id)', t, t);
    execute format('create policy %s_update on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy %s_delete on public.%I for delete to authenticated using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- domain_scores : pas de user_id, appartenance via checkin parent
alter table public.domain_scores enable row level security;
drop policy if exists open_domain_scores_policy on public.domain_scores;
create policy domain_scores_select on public.domain_scores for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_insert on public.domain_scores for insert to authenticated
  with check (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_update on public.domain_scores for update to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_delete on public.domain_scores for delete to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));

-- preset_habits / preset_badges : référence en lecture seule pour authenticated
alter table public.preset_habits enable row level security;
drop policy if exists open_preset_habits_policy on public.preset_habits;
create policy preset_habits_select on public.preset_habits for select to authenticated using (true);

alter table public.preset_badges enable row level security;
drop policy if exists open_preset_badges_policy on public.preset_badges;
create policy preset_badges_select on public.preset_badges for select to authenticated using (true);
