# Design — Réactivation d'habitudes (soft-delete) + réorganisation par catégorie

Date : 2026-08-17

## Contexte

Aujourd'hui, supprimer une habitude (`lib/habits.ts:111` `deleteHabit`) fait un `DELETE` SQL pur,
avec cascade sur `habit_logs` (`schema.sql:69`) : l'habitude et tout son historique disparaissent
définitivement. Vérifié en base live (projet `zlcyqvjqupnjxyzashej`) : aucune habitude ni log
orphelin n'est récupérable pour les suppressions déjà effectuées — cette partie est actée comme
perdue, hors périmètre de ce travail.

Aucune notion d'ordre n'existe non plus (tri actuel = `created_at` uniquement, `lib/habits.ts:24`).

## Objectifs

1. Rendre les suppressions futures réversibles (soft-delete) avec un écran de réactivation dans
   `ManageItemsModal`, taguant clairement les habitudes désactivées.
2. Permettre de réordonner les habitudes au sein d'une catégorie via une flèche "monter d'un cran".
3. Contenir la taille de la base (Supabase gratuit) via une purge quotidienne des logs anciens :
   60 jours pour les habitudes désactivées, alignée sur la fenêtre d'historique visible du
   dashboard (205 jours actuellement) pour les habitudes actives — un seul et même paramètre
   pilote les deux.

## 1. Base de données (nouvelle migration)

```sql
alter table public.habits add column if not exists is_active boolean not null default true;
alter table public.habits add column if not exists position integer not null default 0;

-- Backfill de l'ordre existant (created_at → position par catégorie/utilisateur)
with ranked as (
  select id, row_number() over (partition by user_id, category order by created_at) - 1 as rn
  from public.habits
)
update public.habits h set position = ranked.rn
from ranked where ranked.id = h.id;

-- Autorise une habitude désactivée à coexister avec une active recréée du même nom
alter table public.habits drop constraint if exists habits_user_name_unique;
create unique index if not exists habits_user_name_active_unique
  on public.habits (user_id, name) where is_active;

-- Source unique de vérité pour la fenêtre d'historique visible (dashboard) et la purge
create or replace function public.active_habit_history_days() returns integer
  language sql immutable as $$ select 205 $$;

create or replace function public.purge_old_habit_logs() returns void
  language plpgsql security definer as $$
begin
  delete from public.habit_logs hl
  using public.habits h
  where hl.habit_id = h.id
    and h.is_active = false
    and hl.date < (current_date - interval '60 days');

  delete from public.habit_logs hl
  using public.habits h
  where hl.habit_id = h.id
    and h.is_active = true
    and hl.date < (current_date - (public.active_habit_history_days() || ' days')::interval);
end;
$$;

select cron.schedule(
  'purge-old-habit-logs',
  '0 1 * * *',
  $$select public.purge_old_habit_logs();$$
);
```

Pas de secret impliqué (contrairement à `apply-daily-scoring`/`update-momentum` qui passent par un
edge function + `net.http_post`) : la purge est du SQL pur exécuté directement par `pg_cron`,
committable sans risque de fuite de secret.

`lib/types.ts` — `Habit` gagne `is_active: boolean` et `position: number`.

## 2. `lib/habits.ts`

- `deleteHabit(id)` : `UPDATE habits SET is_active = false WHERE id = id` au lieu d'un `DELETE`
  (signature et call sites inchangés).
- `fetchHabits(userId?)` : ajoute `.eq('is_active', true)`.
- `fetchInactiveHabits(category, userId?)` (nouvelle) : même requête que `fetchHabits` mais
  `.eq('is_active', false)` + filtre catégorie, triée par `created_at desc` (les plus récemment
  désactivées en premier).
- `reactivateHabit(id)` (nouvelle) : calcule `position = max(position) + 1` parmi les habitudes
  actives de la même catégorie/utilisateur, puis `UPDATE habits SET is_active = true, position = ...`.
- `moveHabitUp(habitId, category, userId?)` (nouvelle) : récupère les habitudes actives de la
  catégorie triées par `position`, trouve l'index de `habitId`, si ce n'est pas déjà la première,
  échange les valeurs `position` avec l'habitude précédente (deux `UPDATE`).
- `createHabit` : calcule `position = max(position existant dans user+catégorie) + 1` avant insert
  (au lieu de laisser le défaut `0` pour toutes les nouvelles habitudes).
- `fetchHabits`/`fetchHabitsByCategory` : `.order('position', { ascending: true })` au lieu de
  `created_at`.

## 3. UI

**`components/manage-items-modal.tsx`**
- Chaque ligne de la liste active gagne une flèche ↑ à gauche du nom, désactivée (grisée,
  non cliquable) sur la première ligne de la catégorie ; `onPress` → `moveHabitUp`.
- Nouvelle section sous la liste active, affichée seulement si non vide : titre "Habitudes
  désactivées", chaque ligne = emoji + nom + badge "Désactivée" (pastille grise/muted) + bouton
  "Réactiver" → `reactivateHabit` puis retrait de la ligne de la liste inactive + ajout à la liste
  active locale.

**`app/(tabs)/index.tsx`**
- `handleMoveHabitUp(habitId, category)` : appelle `moveHabitUp`, puis re-fetch ou reordonne
  localement le state `habits` selon les nouvelles positions retournées.
- `handleReactivateItem(habitId)` : appelle `reactivateHabit`, ajoute l'habitude réactivée au state
  `habits` local, la retire du state des habitudes inactives.
- Fetch des habitudes inactives de la catégorie au moment où `ManageItemsModal` s'ouvre
  (`managingCategory` passe de `null` à une catégorie), passé en prop `inactiveHabits`.

## 4. `app/(tabs)/dashboard.tsx`

- Au montage, un appel `supabase.rpc('active_habit_history_days')` récupère le nombre de jours
  (fallback `205` si l'appel échoue, ex. hors-ligne).
- Les 3 usages du littéral `205`/`204` (lignes 41, 62, 64) sont remplacés par cette valeur.

## 5. Tests

- `lib/habits.test.ts` :
  - `deleteHabit` : le test existant passe d'une assertion sur `.delete()` à `.update({ is_active: false })`.
  - `fetchHabits` : nouveau test vérifiant `.eq('is_active', true)`.
  - `reactivateHabit` : nouveau test (update is_active/position).
  - `moveHabitUp` : nouveau test (swap de positions, no-op si déjà en tête).
  - `createHabit` : nouveau test vérifiant le calcul de `position`.
- Pas de test unitaire pour `purge_old_habit_logs()`/`active_habit_history_days()` (fonctions SQL
  pures dépendant d'une vraie base) — vérification manuelle post-déploiement via requête SQL
  (`select public.active_habit_history_days();` et contrôle du `cron.job` après migration).

## Hors périmètre

- Pas de flèche vers le bas (la flèche vers le haut sur chaque ligne permet déjà tout réordonnancement).
- Pas de récupération des habitudes déjà supprimées avant ce changement (confirmé perdu, vérifié en
  base live sur le compte `vaquez.v@gmail.com` : aucun log orphelin, aucune trace).
- Pas de purge sur d'autres tables (`domain_scores`, etc.).
- Pas d'affichage des habitudes désactivées ailleurs que dans `ManageItemsModal` (ni sur l'écran
  principal, ni sur le dashboard).
