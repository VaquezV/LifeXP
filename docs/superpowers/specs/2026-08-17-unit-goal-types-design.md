# Design — Types d'objectif "unité/jour" et "unité/semaine"

Date : 2026-08-17

## Contexte

Le système d'habitudes gère aujourd'hui 4 types de comptage (`FrequencyType` dans `lib/types.ts`) :
`per_day`, `times_per_day`, `times_per_week`, `duration_per_week`.

Certaines habitudes ont des objectifs en grandes quantités non temporelles (10 000 pas/jour,
7 000 calories/semaine). Aujourd'hui elles sont détournées via `per_day` avec un hack d'affichage
(`v >= 1000 → "pas"` dans `add-habit-modal.tsx:60`), et le pas du dropdown (`getStepSize`) utilise
des paliers pensés pour des minutes (5/15/30/60), pas pour de grandes quantités.

## Objectif

Ajouter deux nouveaux types `unit_per_day` et `unit_per_week` qui réutilisent la logique de
scoring existante (ramenée au pourcentage hebdo) mais avec une génération de paliers de dropdown
adaptée aux grandes quantités, et un libellé d'unité affichable (pas, kcal, km, ...).

## 1. Types & DB

- `lib/types.ts:4` — `FrequencyType` étendu :
  `'per_day' | 'times_per_day' | 'times_per_week' | 'duration_per_week' | 'unit_per_day' | 'unit_per_week'`
- `Habit` et `PresetHabit` : nouveau champ `unit_label?: string | null` (ex: `"pas"`, `"kcal"`)
- Nouvelle migration Supabase (pattern de `20260816000000_add_duration_per_week_habits.sql`) :
  - `drop constraint` + `add constraint` sur `habits_frequency_type_check` et
    `preset_habits_frequency_type_check` pour inclure les 2 nouvelles valeurs
  - `alter table habits add column if not exists unit_label text;`
  - `alter table preset_habits add column if not exists unit_label text;`
  - Répercuté dans `supabase/schema.sql` (habits ~ligne 48-63, preset_habits ~ligne 97-120)

## 2. Génération des paliers — nouveau module `lib/checkin-tiers.ts`

Nouveau module partagé (actuellement la logique est dupliquée à l'identique dans
`checkin-item-simplified.tsx` et `checkin-item-with-performance.tsx`).

```ts
export function niceStep(x: number): number
```
Arrondit `x` au multiple le plus proche dans la séquence `{1, 2, 5} × 10ⁿ` (ex: 1667 → 2000,
183 → 200, 12 → 10 ou 15 selon proximité).

```ts
export function getAvailableTiers(habit: Habit | PresetHabit): number[]
```
Dispatch selon `frequency_type` :
- `per_day`, `times_per_day`, `times_per_week`, `duration_per_week` : logique actuelle de
  `getStepSize`/`availableValues`, déplacée telle quelle (comportement inchangé).
- `unit_per_day` :
  `step = niceStep((target_value - min_value) / 6)`
  paliers = `[min_value, min+step, min+2*step, ..., min+5*step, target_value]`,
  dédupliqués et clampés (`target_value` toujours dernier), soit jusqu'à 7 valeurs.
- `unit_per_week` :
  `cap = (target_value / 7) * 1.5` (plafond de saisie pour une journée, pas l'objectif hebdo brut)
  `step = niceStep((cap - min_value) / 6)`
  paliers = `[min_value, min+step, ..., min+5*step, cap]`, dédupliqués et clampés.

`checkin-item-simplified.tsx` et `checkin-item-with-performance.tsx` appellent
`getAvailableTiers(habit)` au lieu de dupliquer `getStepSize`/`availableValues`.
`formatValue` (minutes → `Xh Ym`) reste spécifique à `per_day`/`duration_per_week` ; pour
`unit_per_day`/`unit_per_week` l'affichage est `"${value} ${unit_label ?? ''}"`.

## 3. Affichage

- `add-habit-modal.tsx` :
  - `FREQ_LABELS` : `+ unit_per_day: 'Unité/jour', unit_per_week: 'Unité/sem.'`
  - `formatTarget` : pour les 2 nouveaux types, `"${v} ${preset.unit_label ?? ''}"`.toString(), fallback `String(v)` si `unit_label` absent
- Dropdowns des 2 composants checkin-item : chaque option affiche `${value} ${unit_label ?? ''}`

## 4. Scoring (`lib/scoring.ts`)

- `calculateHabitCompletion` (switch, lignes 86-102) :
  - `unit_per_day` → même branche que `per_day`/`times_per_day` (comparaison objectif du jour)
  - `unit_per_week` → même branche que `times_per_week`/`duration_per_week` (somme des 7 jours / objectif hebdo)
- `calculateWeeklyScore` (ligne 162) : ajouter `unit_per_week` à la liste des types "hebdomadaires"
  (somme sur 7 jours au lieu de moyenne des scores quotidiens)
- `calculateDayCompletion` (lignes 113-114) : ajouter `unit_per_week` à l'exclusion du calcul journalier
- Edge functions `supabase/functions/apply-daily-scoring/index.ts` et
  `supabase/functions/update-momentum/index.ts` : même ajout de branche partout où
  `frequency_type === 'times_per_week' || frequency_type === 'duration_per_week'` apparaît

## 5. Tests

- `lib/checkin-tiers.test.ts` (nouveau) : `niceStep` sur plusieurs ordres de grandeur, génération
  des paliers pour `unit_per_day` (10 000 pas) et `unit_per_week` (7 000 kcal), cas limites
  (petit objectif, `min_value` non nul)
- `lib/scoring.test.ts` : cas `unit_per_day`/`unit_per_week` ajoutés à
  `calculateHabitCompletion`/`calculateWeeklyScore`/`calculateDayCompletion`

## Hors périmètre

- Pas de migration des habitudes existantes utilisant le hack `per_day` (v >= 1000) vers le
  nouveau type `unit_per_day` — décision produit séparée, non traitée ici.
- Pas de liste prédéfinie d'unités (pas, kcal, km...) — `unit_label` est un texte libre saisi à
  la création.
