# Point System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le système EMA/momentum par un système de points par niveau persisté en DB, avec maintenance journalière, avatar loup dérivé des niveaux de catégories, et suppression de tous les pourcentages dans l'UI.

**Architecture:** Deux nouvelles tables Supabase (`scoring_config` et `category_progress`) remplacent `category_momentum`. Une edge function Deno tourne à minuit UTC pour calculer les points gagnés (rolling 7-day) et déduire la maintenance. Le client lit `category_progress` pour afficher points + niveau, et `scoring_config` pour les règles de limite d'habitudes et de progression.

**Tech Stack:** React Native / Expo, Supabase (PostgreSQL + Edge Functions Deno), TypeScript, Jest/jest-expo

**Spec:** `docs/specs/2026-06-24-point-system-redesign-design.md`

---

## File Map

| Fichier | Action | Rôle |
|---------|--------|------|
| `supabase/migrations/20260624_add_scoring_system.sql` | Créer | Drop `category_momentum`, create `scoring_config` + `category_progress` + seed |
| `lib/types.ts` | Modifier | Ajouter `ScoringConfig`, `PtsScaleEntry`, `CategoryProgress` |
| `lib/scoring-config.ts` | Créer | Fetch `scoring_config` depuis Supabase, `applyPtsScale()` |
| `lib/category-progress.ts` | Créer | Fetch `category_progress` depuis Supabase, valeurs par défaut |
| `lib/avatar-level.ts` | Créer | `getAvatarScoreFromLevels()` — pure function |
| `lib/accessoires.ts` | Modifier | Tier depuis level (pas pct), overlay depuis points, noms devise, supprimer EMA refs |
| `supabase/functions/apply-daily-scoring/index.ts` | Créer | Edge function remplaçant `update-momentum` |
| `components/accessory-icon.tsx` | Modifier | Prop `level` (1-5) remplace prop `score` (0-100) |
| `components/accessory-icon.tsx` | Modifier | Prop `level` (1-5) remplace prop `score` (0-100) |
| `components/add-habit-modal.tsx` | Modifier | Ajouter prop `defaultCategory` |
| `components/category-section.tsx` | Modifier | Bouton `+` par catégorie, affichage points+niveau, supprimer barre/% |
| `components/hero-banner.tsx` | Modifier | Supprimer `weeklyScore`, afficher niveau loup |
| `app/(tabs)/index.tsx` | Modifier | Charger `category_progress` + `scoring_config`, supprimer momentum |
| `app/(tabs)/profile.tsx` | Modifier | Grille sans %, zone avatar sans XP bar |
| `lib/momentum-db.ts` | Supprimer | Remplacé par `category-progress.ts` |
| `lib/momentum.ts` | Supprimer | Logique EMA remplacée |

---

## Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/20260624_add_scoring_system.sql`

- [ ] **Step 1: Créer la migration**

```sql
-- supabase/migrations/20260624_add_scoring_system.sql

-- ── 1. Supprimer l'ancien système EMA ──────────────────────────────────────
drop table if exists public.category_momentum cascade;

-- ── 2. scoring_config ──────────────────────────────────────────────────────
create table public.scoring_config (
  level                int     primary key check (level between 1 and 5),
  max_habits           int     not null,
  min_completion_pct   int     not null,
  pts_scale            jsonb   not null,
  daily_maintenance    float   not null,
  points_to_next_level int     not null
);

alter table public.scoring_config enable row level security;

drop policy if exists scoring_config_select on public.scoring_config;
create policy scoring_config_select on public.scoring_config
  for select to authenticated using (true);

-- Seed des 5 niveaux
insert into public.scoring_config (level, max_habits, min_completion_pct, pts_scale, daily_maintenance, points_to_next_level)
values
  (1, 2, 80, '[{"pct":80,"pts":1},{"pct":85,"pts":2},{"pct":90,"pts":3},{"pct":95,"pts":4},{"pct":100,"pts":5}]'::jsonb, 1.5,  50),
  (2, 3, 82, '[{"pct":82,"pts":1},{"pct":87,"pts":2},{"pct":92,"pts":3},{"pct":97,"pts":4},{"pct":100,"pts":5}]'::jsonb, 2.5,  65),
  (3, 4, 84, '[{"pct":84,"pts":1},{"pct":89,"pts":2},{"pct":94,"pts":3},{"pct":99,"pts":4},{"pct":100,"pts":5}]'::jsonb, 4.0,  85),
  (4, 5, 86, '[{"pct":86,"pts":1},{"pct":91,"pts":2},{"pct":96,"pts":3},{"pct":99,"pts":4},{"pct":100,"pts":5}]'::jsonb, 6.5, 110),
  (5, 5, 95, '[{"pct":95,"pts":1},{"pct":97,"pts":3},{"pct":99,"pts":4},{"pct":100,"pts":5}]'::jsonb,               10.0, 140);

-- ── 3. category_progress ───────────────────────────────────────────────────
create table public.category_progress (
  user_id               uuid not null references auth.users(id) on delete cascade,
  category              text not null check (category in ('self_care','dev_perso','vie_familiale','vie_pro')),
  current_level         int  not null default 1 check (current_level between 1 and 5),
  points_in_level       float not null default 0,
  last_maintenance_date date,
  updated_at            timestamptz not null default now(),
  constraint category_progress_pkey primary key (user_id, category)
);

alter table public.category_progress enable row level security;

drop policy if exists category_progress_select on public.category_progress;
create policy category_progress_select on public.category_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists category_progress_insert on public.category_progress;
create policy category_progress_insert on public.category_progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists category_progress_update on public.category_progress;
create policy category_progress_update on public.category_progress
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists category_progress_delete on public.category_progress;
create policy category_progress_delete on public.category_progress
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists category_progress_service on public.category_progress;
create policy category_progress_service on public.category_progress
  for all to service_role using (true) with check (true);

create index if not exists category_progress_user_idx on public.category_progress(user_id);
```

- [ ] **Step 2: Appliquer la migration en local (si Supabase CLI disponible)**

```bash
npx supabase db reset
# ou: npx supabase migration up
```

Si pas de CLI local, appliquer manuellement dans le dashboard Supabase SQL Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260624_add_scoring_system.sql
git commit -m "feat(db): add scoring_config and category_progress tables, drop category_momentum"
```

---

## Task 2: Types TypeScript

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Ajouter les nouveaux types à `lib/types.ts`**

Ajouter à la fin du fichier (après `PresetHabitWithBadges`) :

```typescript
export interface PtsScaleEntry {
  pct: number;
  pts: number;
}

export interface ScoringConfig {
  level: number;
  max_habits: number;
  min_completion_pct: number;
  pts_scale: PtsScaleEntry[];
  daily_maintenance: number;
  points_to_next_level: number;
}

export interface CategoryProgress {
  user_id: string;
  category: CategoryType;
  current_level: number;
  points_in_level: number;
  last_maintenance_date: string | null;
  updated_at: string;
}
```

- [ ] **Step 2: Vérifier que TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(types): add ScoringConfig, PtsScaleEntry, CategoryProgress types"
```

---

## Task 3: lib/scoring-config.ts

**Files:**
- Create: `lib/scoring-config.ts`
- Create: `lib/scoring-config.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// lib/scoring-config.test.ts
import { applyPtsScale } from './scoring-config';
import { PtsScaleEntry } from './types';

const N1_SCALE: PtsScaleEntry[] = [
  { pct: 80, pts: 1 },
  { pct: 85, pts: 2 },
  { pct: 90, pts: 3 },
  { pct: 95, pts: 4 },
  { pct: 100, pts: 5 },
];

const N5_SCALE: PtsScaleEntry[] = [
  { pct: 95, pts: 1 },
  { pct: 97, pts: 3 },
  { pct: 99, pts: 4 },
  { pct: 100, pts: 5 },
];

describe('applyPtsScale', () => {
  it('retourne 0 si pct est en dessous du seuil minimum N1', () => {
    expect(applyPtsScale(N1_SCALE, 0)).toBe(0);
    expect(applyPtsScale(N1_SCALE, 79)).toBe(0);
  });

  it('retourne 1 au seuil minimum N1 (80%)', () => {
    expect(applyPtsScale(N1_SCALE, 80)).toBe(1);
    expect(applyPtsScale(N1_SCALE, 84)).toBe(1);
  });

  it('retourne 5 à 100% N1', () => {
    expect(applyPtsScale(N1_SCALE, 100)).toBe(5);
  });

  it('utilise le palier le plus haut atteint', () => {
    expect(applyPtsScale(N1_SCALE, 90)).toBe(3);
    expect(applyPtsScale(N1_SCALE, 95)).toBe(4);
    expect(applyPtsScale(N1_SCALE, 97)).toBe(4);
  });

  it('retourne 0 si pct < 95 au N5', () => {
    expect(applyPtsScale(N5_SCALE, 94)).toBe(0);
  });

  it('N5 n'a pas de palier à 2pts — saute de 1 à 3', () => {
    expect(applyPtsScale(N5_SCALE, 95)).toBe(1);
    expect(applyPtsScale(N5_SCALE, 96)).toBe(1);
    expect(applyPtsScale(N5_SCALE, 97)).toBe(3);
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
npx jest lib/scoring-config.test.ts --no-coverage
```

Expected: FAIL (module not found)

- [ ] **Step 3: Créer `lib/scoring-config.ts`**

```typescript
// lib/scoring-config.ts
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { ScoringConfig, PtsScaleEntry } from './types';

export { applyPtsScale };

export const SCORING_CONFIG_FALLBACK: ScoringConfig[] = [
  { level: 1, max_habits: 2, min_completion_pct: 80, daily_maintenance: 1.5, points_to_next_level: 50,
    pts_scale: [{pct:80,pts:1},{pct:85,pts:2},{pct:90,pts:3},{pct:95,pts:4},{pct:100,pts:5}] },
  { level: 2, max_habits: 3, min_completion_pct: 82, daily_maintenance: 2.5, points_to_next_level: 65,
    pts_scale: [{pct:82,pts:1},{pct:87,pts:2},{pct:92,pts:3},{pct:97,pts:4},{pct:100,pts:5}] },
  { level: 3, max_habits: 4, min_completion_pct: 84, daily_maintenance: 4.0, points_to_next_level: 85,
    pts_scale: [{pct:84,pts:1},{pct:89,pts:2},{pct:94,pts:3},{pct:99,pts:4},{pct:100,pts:5}] },
  { level: 4, max_habits: 5, min_completion_pct: 86, daily_maintenance: 6.5, points_to_next_level: 110,
    pts_scale: [{pct:86,pts:1},{pct:91,pts:2},{pct:96,pts:3},{pct:99,pts:4},{pct:100,pts:5}] },
  { level: 5, max_habits: 5, min_completion_pct: 95, daily_maintenance: 10.0, points_to_next_level: 140,
    pts_scale: [{pct:95,pts:1},{pct:97,pts:3},{pct:99,pts:4},{pct:100,pts:5}] },
];

function applyPtsScale(scale: PtsScaleEntry[], completionPct: number): number {
  let result = 0;
  for (const entry of scale) {
    if (completionPct >= entry.pct) result = entry.pts;
  }
  return result;
}

export function getScoringConfigForLevel(configs: ScoringConfig[], level: number): ScoringConfig {
  return configs.find(c => c.level === level) ?? SCORING_CONFIG_FALLBACK[0];
}

export async function fetchScoringConfig(): Promise<ScoringConfig[]> {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE);
  const { data, error } = await supabase
    .from('scoring_config')
    .select('*')
    .order('level', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScoringConfig[];
}
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
npx jest lib/scoring-config.test.ts --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/scoring-config.ts lib/scoring-config.test.ts
git commit -m "feat: add scoring-config module with applyPtsScale and fetchScoringConfig"
```

---

## Task 4: lib/category-progress.ts

**Files:**
- Create: `lib/category-progress.ts`

- [ ] **Step 1: Créer `lib/category-progress.ts`**

```typescript
// lib/category-progress.ts
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { requireUserId } from './auth';
import { CategoryProgress, CategoryType, CATEGORY_KEYS } from './types';

function ensureSupabase() {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE);
  return supabase;
}

export function defaultCategoryProgress(userId: string, category: CategoryType): CategoryProgress {
  return {
    user_id: userId,
    category,
    current_level: 1,
    points_in_level: 0,
    last_maintenance_date: null,
    updated_at: new Date().toISOString(),
  };
}

export function defaultAllCategoryProgress(userId: string): Record<CategoryType, CategoryProgress> {
  return Object.fromEntries(
    CATEGORY_KEYS.map(cat => [cat, defaultCategoryProgress(userId, cat)])
  ) as Record<CategoryType, CategoryProgress>;
}

export async function fetchCategoryProgress(): Promise<Record<CategoryType, CategoryProgress>> {
  const client = ensureSupabase();
  const userId = await requireUserId();
  const { data, error } = await client
    .from('category_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  const defaults = defaultAllCategoryProgress(userId);
  for (const row of (data ?? []) as CategoryProgress[]) {
    defaults[row.category as CategoryType] = row;
  }
  return defaults;
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add lib/category-progress.ts
git commit -m "feat: add category-progress module with fetchCategoryProgress"
```

---

## Task 5: lib/avatar-level.ts

**Files:**
- Create: `lib/avatar-level.ts`
- Create: `lib/avatar-level.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// lib/avatar-level.test.ts
import { getAvatarScoreFromLevels } from './avatar-level';
import { CategoryType } from './types';

function levels(sc: number, dp: number, vf: number, vp: number): Record<CategoryType, number> {
  return { self_care: sc, dev_perso: dp, vie_familiale: vf, vie_pro: vp };
}

describe('getAvatarScoreFromLevels', () => {
  it('toutes N1 → 5', () => {
    expect(getAvatarScoreFromLevels(levels(1, 1, 1, 1))).toBe(5);
  });

  it('1 catégorie N2 → 15', () => {
    expect(getAvatarScoreFromLevels(levels(2, 1, 1, 1))).toBe(15);
  });

  it('2 catégories N2 → 25', () => {
    expect(getAvatarScoreFromLevels(levels(2, 2, 1, 1))).toBe(25);
  });

  it('toutes N2 → 35', () => {
    expect(getAvatarScoreFromLevels(levels(2, 2, 2, 2))).toBe(35);
  });

  it('2 N2 + 2 N3 → 45', () => {
    expect(getAvatarScoreFromLevels(levels(3, 3, 2, 2))).toBe(45);
  });

  it('toutes N3 → 55 (pas 45 — évaluation du plus haut au plus bas)', () => {
    expect(getAvatarScoreFromLevels(levels(3, 3, 3, 3))).toBe(55);
  });

  it('2 N3 + 2 N4 → 65', () => {
    expect(getAvatarScoreFromLevels(levels(4, 4, 3, 3))).toBe(65);
  });

  it('toutes N4 → 75', () => {
    expect(getAvatarScoreFromLevels(levels(4, 4, 4, 4))).toBe(75);
  });

  it('2 N4 + 2 N5 → 85', () => {
    expect(getAvatarScoreFromLevels(levels(5, 5, 4, 4))).toBe(85);
  });

  it('toutes N5 → 95', () => {
    expect(getAvatarScoreFromLevels(levels(5, 5, 5, 5))).toBe(95);
  });

  it('N5 compte aussi pour ≥N2, ≥N3, ≥N4 — évalue par le plus haut', () => {
    // 3 cats N5 + 1 cat N1 → 2 N4 + 2 N5 (les 3 N5 >= N4 et >= N5, 1 N1 ne compte pas)
    // 3 >= N4 satisfait "≥ 2 à N4 + ≥ 2 à N5" (3 >= N5 → ≥ 2 à N5, 3 >= N4 → ≥ 2 à N4) → 85
    expect(getAvatarScoreFromLevels(levels(5, 5, 5, 1))).toBe(85);
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
npx jest lib/avatar-level.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Créer `lib/avatar-level.ts`**

```typescript
// lib/avatar-level.ts
import { CategoryType } from './types';

export type CategoryLevels = Record<CategoryType, number>;

function countAtLeast(levels: CategoryLevels, minLevel: number): number {
  return Object.values(levels).filter(l => l >= minLevel).length;
}

export function getAvatarScoreFromLevels(levels: CategoryLevels): number {
  if (countAtLeast(levels, 5) >= 4) return 95;
  if (countAtLeast(levels, 5) >= 2 && countAtLeast(levels, 4) >= 2) return 85;
  if (countAtLeast(levels, 4) >= 4) return 75;
  if (countAtLeast(levels, 4) >= 2 && countAtLeast(levels, 3) >= 2) return 65;
  if (countAtLeast(levels, 3) >= 4) return 55;
  if (countAtLeast(levels, 3) >= 2 && countAtLeast(levels, 2) >= 2) return 45;
  if (countAtLeast(levels, 2) >= 4) return 35;
  if (countAtLeast(levels, 2) >= 2) return 25;
  if (countAtLeast(levels, 2) >= 1) return 15;
  return 5;
}
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
npx jest lib/avatar-level.test.ts --no-coverage
```

Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/avatar-level.ts lib/avatar-level.test.ts
git commit -m "feat: add getAvatarScoreFromLevels — wolf avatar driven by category levels"
```

---

## Task 6: Mettre à jour lib/accessoires.ts

**Files:**
- Modify: `lib/accessoires.ts`

- [ ] **Step 1: Réécrire `lib/accessoires.ts` entièrement**

```typescript
// lib/accessoires.ts
import { CategoryType } from './types';

const ACCESSORY_TYPE: Record<CategoryType, string> = {
  self_care: 'antre',
  dev_perso: 'cri',
  vie_familiale: 'meute',
  vie_pro: 'totem',
};

export const ACCESSORY_LABELS: Record<CategoryType, string> = {
  self_care: 'Antre',
  dev_perso: 'Cri',
  vie_familiale: 'Meute',
  vie_pro: 'Totem',
};

export const CATEGORY_CURRENCY_NAMES: Record<CategoryType, string> = {
  self_care: 'Paille',
  dev_perso: 'Souffle',
  vie_familiale: 'Interaction',
  vie_pro: 'Influence',
};

// level 1-5 → tier index 0-4
export function getAccessoryTierFromLevel(level: number): 0 | 1 | 2 | 3 | 4 {
  const clamped = Math.min(Math.max(level, 1), 5);
  return (clamped - 1) as 0 | 1 | 2 | 3 | 4;
}

export function getAccessoryTierLabel(level: number): string {
  return `Palier ${level}/5`;
}

export function getAccessoryFileName(category: CategoryType, level: number): string {
  const type = ACCESSORY_TYPE[category];
  const tiers = ['0-20', '21-40', '41-60', '61-80', '81-100'] as const;
  return `${type}.${tiers[getAccessoryTierFromLevel(level)]}.svg`;
}

export function getNextTierFileName(category: CategoryType, level: number): string {
  const nextLevel = Math.min(level + 1, 5);
  return getAccessoryFileName(category, nextLevel);
}

export function getOverlayHeight(pointsInLevel: number, pointsToNextLevel: number): number {
  if (pointsToNextLevel <= 0) return 0;
  const progress = Math.min(1, pointsInLevel / pointsToNextLevel);
  return Math.round((1 - progress) * 100);
}

export function getAccessoryDisplayState(
  level: number,
  pointsInLevel: number,
  pointsToNextLevel: number,
): { overlayHeight: number; overlayColor: string } {
  return {
    overlayHeight: getOverlayHeight(pointsInLevel, pointsToNextLevel),
    overlayColor: 'rgba(128, 128, 128, 0.6)',
  };
}

const WOLF_QUOTES: Array<{ minScore: number; quote: string }> = [
  { minScore: 0,  quote: 'Même le loup le plus faible peut apprendre à chasser.' },
  { minScore: 25, quote: 'Chaque pas trace le chemin. Continue.' },
  { minScore: 45, quote: "La meute ne s'arrête pas quand les pattes font mal." },
  { minScore: 65, quote: 'Tu es dans ta zone. Le loup ne recule pas.' },
  { minScore: 85, quote: 'La forêt tremble quand le loup hurle à pleine puissance.' },
];

export function getWolfQuote(avatarScore: number): string {
  let quote = WOLF_QUOTES[0].quote;
  for (const entry of WOLF_QUOTES) {
    if (avatarScore >= entry.minScore) quote = entry.quote;
  }
  return quote;
}
```

- [ ] **Step 2: Mettre à jour `components/accessory-icon.tsx` — prop `level` au lieu de `score`**

```typescript
// components/accessory-icon.tsx
import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { CategoryType } from '@/lib/types';
import { getNextTierFileName } from '@/lib/accessoires';

const ACCESSORY_ASSETS = {
  'antre.0-20.svg':   require('@/assets/accessoires/antre.0-20.svg'),
  'antre.21-40.svg':  require('@/assets/accessoires/antre.21-40.svg'),
  'antre.41-60.svg':  require('@/assets/accessoires/antre.41-60.svg'),
  'antre.61-80.svg':  require('@/assets/accessoires/antre.61-80.svg'),
  'antre.81-100.svg': require('@/assets/accessoires/antre.81-100.svg'),
  'cri.0-20.svg':     require('@/assets/accessoires/cri.0-20.svg'),
  'cri.21-40.svg':    require('@/assets/accessoires/cri.21-40.svg'),
  'cri.41-60.svg':    require('@/assets/accessoires/cri.41-60.svg'),
  'cri.61-80.svg':    require('@/assets/accessoires/cri.61-80.svg'),
  'cri.81-100.svg':   require('@/assets/accessoires/cri.81-100.svg'),
  'meute.0-20.svg':   require('@/assets/accessoires/meute.0-20.svg'),
  'meute.21-40.svg':  require('@/assets/accessoires/meute.21-40.svg'),
  'meute.41-60.svg':  require('@/assets/accessoires/meute.41-60.svg'),
  'meute.61-80.svg':  require('@/assets/accessoires/meute.61-80.svg'),
  'meute.81-100.svg': require('@/assets/accessoires/meute.81-100.svg'),
  'totem.0-20.svg':   require('@/assets/accessoires/totem.0-20.svg'),
  'totem.21-40.svg':  require('@/assets/accessoires/totem.21-40.svg'),
  'totem.41-60.svg':  require('@/assets/accessoires/totem.41-60.svg'),
  'totem.61-80.svg':  require('@/assets/accessoires/totem.61-80.svg'),
  'totem.81-100.svg': require('@/assets/accessoires/totem.81-100.svg'),
} as const;

interface AccessoryIconProps {
  category:       CategoryType;
  level:          number;        // 1-5, niveau de la catégorie
  size?:          number;
  overlayHeight?: number;        // 0-100: % hauteur couverte depuis le haut
  overlayColor?:  string;
}

function AccessoryIconComponent({
  category,
  level,
  size = 40,
  overlayHeight = 0,
  overlayColor = 'rgba(128, 128, 128, 0.6)',
}: AccessoryIconProps) {
  const uri = useMemo(() => {
    const fileName = getNextTierFileName(category, level);
    const asset = ACCESSORY_ASSETS[fileName as keyof typeof ACCESSORY_ASSETS];
    return asset ? Asset.fromModule(asset).uri : null;
  }, [category, level]);

  const coverPixels = Math.round((overlayHeight / 100) * size);

  if (!uri) return <View style={[styles.container, { width: size, height: size }]} />;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <SvgUri width={size} height={size} uri={uri} />
      {coverPixels > 0 && (
        <View
          pointerEvents="none"
          style={[styles.overlay, { height: coverPixels, backgroundColor: overlayColor }]}
        />
      )}
    </View>
  );
}

export const AccessoryIcon = memo(AccessoryIconComponent);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
});
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Il y aura des erreurs dans les fichiers qui importent les anciennes signatures — c'est normal, elles seront corrigées dans les tâches suivantes. Vérifier qu'il n'y a pas d'erreurs dans `lib/accessoires.ts` lui-même.

- [ ] **Step 3: Vérifier que les tests existants passent encore**

```bash
npx jest lib/ --no-coverage
```

- [ ] **Step 4: Commit**

```bash
git add lib/accessoires.ts
git commit -m "feat: update accessoires.ts — tier from level, overlay from points, currency names, remove EMA refs"
```

---

## Task 7: Edge function apply-daily-scoring

**Files:**
- Create: `supabase/functions/apply-daily-scoring/index.ts`

- [ ] **Step 1: Créer la fonction**

```typescript
// supabase/functions/apply-daily-scoring/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PtsScaleEntry { pct: number; pts: number; }
interface ScoringConfig {
  level: number;
  max_habits: number;
  min_completion_pct: number;
  pts_scale: PtsScaleEntry[];
  daily_maintenance: number;
  points_to_next_level: number;
}

function applyPtsScale(scale: PtsScaleEntry[], completionPct: number): number {
  let result = 0;
  for (const entry of scale) {
    if (completionPct >= entry.pct) result = entry.pts;
  }
  return result;
}

function calcHabitCompletionPct(habit: any, weekLogs: Record<string, Record<string, number>>): number {
  const dates = Object.keys(weekLogs).sort();
  if (dates.length === 0) return 0;

  if (habit.frequency_type === 'times_per_week') {
    const total = dates.reduce((s: number, d: string) => s + (weekLogs[d]?.[habit.id] ?? 0), 0);
    return habit.target_value === 0 ? 0 : Math.min(100, Math.round((total / habit.target_value) * 100));
  }

  const dayScores: number[] = [];
  for (const date of dates) {
    const v = weekLogs[date]?.[habit.id] ?? 0;
    let pct = 0;
    if (habit.frequency_type === 'per_day') {
      if (v < habit.min_value) pct = 0;
      else if (v >= habit.target_value) pct = 100;
      else {
        const range = habit.target_value - habit.min_value;
        pct = range === 0 ? 100 : Math.round(((v - habit.min_value) / range) * 100);
      }
    } else {
      pct = habit.target_value === 0 ? 0 : Math.max(0, Math.min(100, Math.round((v / habit.target_value) * 100)));
    }
    dayScores.push(pct);
  }
  return Math.round(dayScores.reduce((s, p) => s + p, 0) / dayScores.length);
}

const CATEGORIES = ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const;

Deno.serve(async (req: Request) => {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 6 * 86_400_000).toISOString().split('T')[0];

  // Load config once
  const { data: configRows, error: configErr } = await client.from('scoring_config').select('*');
  if (configErr) return new Response('Config load failed', { status: 500 });
  const configs: Record<number, ScoringConfig> = {};
  for (const row of configRows ?? []) configs[row.level] = row as ScoringConfig;

  // Get all users with habits
  const { data: habitRows } = await client.from('habits').select('user_id');
  const userIds = [...new Set((habitRows ?? []).map((r: any) => r.user_id as string))];

  let updated = 0;

  for (const userId of userIds) {
    const { data: habits } = await client.from('habits').select('*').eq('user_id', userId);
    if (!habits?.length) continue;

    const { data: logs } = await client
      .from('habit_logs')
      .select('date, habit_id, value')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .lte('date', today);

    const weekLogs: Record<string, Record<string, number>> = {};
    for (const log of logs ?? []) {
      if (!weekLogs[log.date]) weekLogs[log.date] = {};
      weekLogs[log.date][log.habit_id] = log.value;
    }

    // Load existing progress (all categories at once)
    const { data: progressRows } = await client
      .from('category_progress')
      .select('*')
      .eq('user_id', userId);

    const existingProgress: Record<string, any> = {};
    for (const row of progressRows ?? []) existingProgress[row.category] = row;

    for (const category of CATEGORIES) {
      const existing = existingProgress[category];

      // Anti-doublon: skip if already processed today
      if (existing?.last_maintenance_date === today) continue;

      const currentLevel: number = existing?.current_level ?? 1;
      let pointsInLevel: number = existing?.points_in_level ?? 0;

      const config: ScoringConfig = configs[currentLevel];
      if (!config) continue;

      // Calculate rolling 7-day pts for each habit in this category
      const catHabits = habits.filter((h: any) => h.category === category);
      let ptsToday = 0;
      for (const habit of catHabits) {
        const completionPct = calcHabitCompletionPct(habit, weekLogs);
        ptsToday += applyPtsScale(config.pts_scale, completionPct);
      }

      // Apply net (earned - maintenance), floor at 0
      const net = ptsToday - config.daily_maintenance;
      pointsInLevel = Math.max(0, pointsInLevel + net);

      // Level up if threshold reached (consume points, carry over remainder)
      let newLevel = currentLevel;
      if (pointsInLevel >= config.points_to_next_level && currentLevel < 5) {
        pointsInLevel -= config.points_to_next_level;
        newLevel = currentLevel + 1;
      }

      await client.from('category_progress').upsert(
        {
          user_id: userId,
          category,
          current_level: newLevel,
          points_in_level: pointsInLevel,
          last_maintenance_date: today,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category' },
      );
    }
    updated++;
  }

  return new Response(JSON.stringify({ updated, date: today }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Vérifier TypeScript de la fonction (optionnel si Deno CLI disponible)**

```bash
deno check supabase/functions/apply-daily-scoring/index.ts
```

Si Deno n'est pas installé, une relecture manuelle suffit.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/apply-daily-scoring/index.ts
git commit -m "feat(edge): add apply-daily-scoring function replacing update-momentum"
```

---

## Task 8: AddHabitModal — prop defaultCategory

**Files:**
- Modify: `components/add-habit-modal.tsx`

- [ ] **Step 1: Ajouter `defaultCategory` à l'interface `Props`**

Dans `components/add-habit-modal.tsx`, modifier l'interface `Props` :

```typescript
interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (habit: {
    name: string;
    emoji: string;
    category: CategoryType;
    frequency_type: FrequencyType;
    target_value: number;
    min_value: number;
    preset_habit_id: string | null;
  }) => Promise<void>;
  presets: PresetHabit[];
  defaultCategory?: CategoryType;
}
```

- [ ] **Step 2: Utiliser `defaultCategory` dans la fonction composant**

Remplacer la signature de la fonction et la logique de reset :

```typescript
export function AddHabitModal({ visible, onClose, onSave, presets, defaultCategory }: Props) {
```

Trouver la ligne où `form` est initialisé (vers ligne 80) et remplacer :

```typescript
const [form, setForm] = useState<HabitForm>({
  name: '',
  emoji: '⭐',
  category: defaultCategory ?? 'self_care',
  frequency_type: 'per_day',
  target_value: 30,
  min_value: 0,
  preset_habit_id: null,
});
```

Trouver la fonction `resetAndClose` et mettre à jour le reset de `form` :

```typescript
function resetAndClose() {
  setStep('picker');
  setForm({
    name: '',
    emoji: '⭐',
    category: defaultCategory ?? 'self_care',
    frequency_type: 'per_day',
    target_value: 30,
    min_value: 0,
    preset_habit_id: null,
  });
  onClose();
}
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/add-habit-modal.tsx
git commit -m "feat(ui): add defaultCategory prop to AddHabitModal"
```

---

## Task 9: CategorySection — nouveau UI

**Files:**
- Modify: `components/category-section.tsx`

- [ ] **Step 1: Réécrire `components/category-section.tsx`**

```typescript
// components/category-section.tsx
import { CATEGORY_COLORS } from '@/constants/Colors';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  ACCESSORY_LABELS,
  CATEGORY_CURRENCY_NAMES,
  getAccessoryTierLabel,
  getAccessoryDisplayState,
} from '@/lib/accessoires';
import { CategoryType, Habit } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, ToastAndroid, View, Alert } from 'react-native';
import { AccessoryIcon } from './accessory-icon';
import { CategoryModal } from './category-modal';
import { HabitCard } from './habit-card';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export interface CategorySectionProps {
  category: CategoryType;
  categoryLabel: string;
  categoryLevel: number;
  pointsInLevel: number;
  pointsToNextLevel: number;
  maxHabits: number;
  habits: Habit[];
  weekDates: string[];
  weekValues: Record<string, Record<string, number>>;
  onHabitValueChange: (habitId: string, date: string, newValue: number) => void;
  onHabitUpdate?: (updatedHabit: Habit) => void;
  onHabitDelete?: (habitId: string) => void;
  onAddHabit?: () => void;
  onUpdateCategory?: (label: string, color: string) => void;
  onAccessoryPress?: () => void;
}

export function CategorySection({
  category,
  categoryLabel,
  categoryLevel,
  pointsInLevel,
  pointsToNextLevel,
  maxHabits,
  habits,
  weekDates,
  weekValues,
  onHabitValueChange,
  onHabitUpdate,
  onHabitDelete,
  onAddHabit,
  onUpdateCategory,
  onAccessoryPress,
}: CategorySectionProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const categoryColor = CATEGORY_COLORS[category];
  const accentColor = categoryColor.mid;
  const categoryHabits = habits.filter(h => h.category === category);
  const habitCount = categoryHabits.length;
  const hasSlot = habitCount < maxHabits;

  const { overlayHeight, overlayColor } = getAccessoryDisplayState(
    categoryLevel,
    pointsInLevel,
    pointsToNextLevel,
  );

  const currencyName = CATEGORY_CURRENCY_NAMES[category];
  const tierLabel = getAccessoryTierLabel(categoryLevel);
  const accessoryLabel = ACCESSORY_LABELS[category];
  const pointsDisplay = `${Math.floor(pointsInLevel)} pts de ${currencyName}`;
  const levelDisplay = `N${categoryLevel} · ${tierLabel}`;

  // Pulse animation when slot available
  useEffect(() => {
    if (!hasSlot) { pulseAnim.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [hasSlot]);

  function handleAddPress() {
    if (!onAddHabit) return;
    if (hasSlot) {
      onAddHabit();
    } else {
      const msg = categoryLevel < 5
        ? `Niveau N${categoryLevel + 1} requis pour ajouter une habitude ici`
        : 'Niveau maximum atteint pour cette catégorie';
      showToast(msg);
    }
  }

  if (categoryHabits.length === 0 && !onAddHabit) return null;

  return (
    <ThemedView style={[styles.section, themeStyles.surface]}>
      <CategoryModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={(name, color) => onUpdateCategory?.(name, color)}
        initialName={categoryLabel}
        initialColor={accentColor}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onAccessoryPress}
          style={[styles.accessoryWrapper, { borderColor: accentColor + '44' }]}
          accessibilityRole="button"
          accessibilityLabel={`${accessoryLabel} — ${tierLabel}`}
        >
          <AccessoryIcon
            category={category}
            level={categoryLevel}
            size={48}
            overlayHeight={overlayHeight}
            overlayColor={overlayColor}
          />
        </Pressable>

        <View style={styles.categoryInfo}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={[styles.categoryTitle, { color: colors.text }]}>
              {categoryLabel}
            </ThemedText>
            <View style={styles.titleActions}>
              {onUpdateCategory && (
                <Pressable onPress={() => setEditModalVisible(true)} style={styles.iconButton}>
                  <MaterialIcons name="edit" size={16} color={accentColor} />
                </Pressable>
              )}
              {onAddHabit && (
                <Pressable onPress={handleAddPress} style={styles.iconButton} accessibilityRole="button">
                  <Animated.View style={{ transform: [{ scale: hasSlot ? pulseAnim : 1 }] }}>
                    <MaterialIcons
                      name={hasSlot ? 'add-circle' : 'lock'}
                      size={20}
                      color={hasSlot ? accentColor : colors.textSubtle}
                    />
                  </Animated.View>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <ThemedText style={[styles.pointsText, { color: accentColor }]}>
              {pointsDisplay}
            </ThemedText>
            <ThemedText style={[styles.levelText, { color: colors.textSubtle }]}>
              {levelDisplay}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Habits */}
      <View style={styles.habitsContainer}>
        {categoryHabits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            weekDates={weekDates}
            weekValues={weekValues}
            onValueChange={onHabitValueChange}
            onHabitUpdate={onHabitUpdate}
            onHabitDelete={onHabitDelete}
          />
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 14,
    paddingVertical: 0,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  accessoryWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  categoryInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelText: {
    fontSize: 10,
  },
  habitsContainer: {
    paddingBottom: 12,
  },
});
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/category-section.tsx
git commit -m "feat(ui): CategorySection — points+level display, per-category + button, remove progress bar"
```

---

## Task 10: HeroBanner — supprimer weeklyScore

**Files:**
- Modify: `components/hero-banner.tsx`

- [ ] **Step 1: Réécrire `components/hero-banner.tsx`**

```typescript
// components/hero-banner.tsx
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useThemeContext } from '@/lib/theme-context';
import { ThemedText } from './themed-text';
import { Avatar } from './avatar';
import { getWolfQuote } from '@/lib/accessoires';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';

interface WeekDay {
  abbr: string;
  date: string;
  completion?: number;
  isToday?: boolean;
}

interface HeroBannerProps {
  avatarScore: number;
  weekDays: WeekDay[];
}

function computeStreak(days: WeekDay[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if ((days[i].completion ?? 0) > 0) streak++;
    else break;
  }
  return streak;
}

export function HeroBanner({ avatarScore, weekDays }: HeroBannerProps) {
  const { colors, isDark } = useAppTheme();
  const { toggleTheme } = useThemeContext();
  const streak = computeStreak(weekDays);
  const quote = getWolfQuote(avatarScore);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <ThemedText style={styles.appTitle}>LifeXP</ThemedText>
        <TouchableOpacity onPress={toggleTheme} hitSlop={8} accessibilityRole="button">
          <MaterialIcons
            name={isDark ? 'wb-sunny' : 'brightness-3'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.wolfRow}>
        <View style={styles.avatarCircle}>
          <Avatar score={avatarScore} size="small" />
        </View>
        <View style={styles.scoreBlock}>
          {streak > 0 && (
            <ThemedText style={[styles.streakText, { color: colors.tint }]}>
              🔥 {streak} jour{streak > 1 ? 's' : ''} d'affilée
            </ThemedText>
          )}
        </View>
      </View>

      <View style={[styles.quoteBox, { borderLeftColor: colors.tint + '55', backgroundColor: colors.tint + '0a' }]}>
        <ThemedText style={[styles.quoteText, { color: colors.textMuted }]}>
          "{quote}"
        </ThemedText>
      </View>

      <View style={styles.weekStrip}>
        {weekDays.map((day, idx) => {
          const done = (day.completion ?? 0) > 0;
          return (
            <View
              key={idx}
              style={[
                styles.dayChip,
                {
                  backgroundColor: day.isToday
                    ? colors.tint + '15'
                    : done
                      ? colors.tint + '12'
                      : colors.surfaceMuted,
                  borderColor: day.isToday ? colors.tint + '66' : 'transparent',
                  borderWidth: day.isToday ? 1 : 0,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.dayLabel,
                  {
                    color: day.isToday
                      ? colors.tint
                      : done
                        ? colors.tint + 'aa'
                        : colors.textSubtle,
                  },
                ]}
              >
                {day.abbr}
              </ThemedText>
              <View
                style={[
                  styles.dayPip,
                  {
                    backgroundColor: day.isToday ? colors.tint : done ? colors.tint : colors.border,
                    opacity: done || day.isToday ? 1 : 0.3,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  wolfRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scoreBlock: { flex: 1, gap: 2 },
  streakText: { fontSize: 12, fontWeight: '600' },
  quoteBox: { borderLeftWidth: 2, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 },
  quoteText: { fontSize: 11, fontStyle: 'italic', lineHeight: 16 },
  weekStrip: { flexDirection: 'row', gap: 4 },
  dayChip: { flex: 1, borderRadius: 6, paddingVertical: 5, alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.3 },
  dayPip: { width: 5, height: 5, borderRadius: 3 },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/hero-banner.tsx
git commit -m "feat(ui): HeroBanner — remove weeklyScore %, use avatarScore for wolf display"
```

---

## Task 11: app/(tabs)/index.tsx — câbler les nouvelles données

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Réécrire `app/(tabs)/index.tsx`**

```typescript
// app/(tabs)/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from '@/hooks/use-translation';
import { HeroBanner } from '@/components/hero-banner';
import { CategorySection } from '@/components/category-section';
import { fetchHabits, createHabit } from '@/lib/habits';
import { fetchAllLogsForDate, logHabitValue } from '@/lib/habit-logs';
import { calculateDayCompletion } from '@/lib/scoring';
import { Habit, CategoryType, FrequencyType, PresetHabit, CATEGORY_KEYS, ScoringConfig } from '@/lib/types';
import { CATEGORY_TRANSLATION_KEY } from '@/lib/translations';
import { requireUserId } from '@/lib/auth';
import { AddHabitModal } from '@/components/add-habit-modal';
import { fetchPresetHabits } from '@/lib/preset-habits';
import { useAppTheme } from '@/hooks/use-app-theme';
import { fetchCategoryProgress, defaultAllCategoryProgress } from '@/lib/category-progress';
import { fetchScoringConfig, getScoringConfigForLevel, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import { getAvatarScoreFromLevels } from '@/lib/avatar-level';
import type { CategoryProgress } from '@/lib/types';

function getCategories(t: (key: any) => string): { key: CategoryType; label: string }[] {
  return CATEGORY_KEYS.map(key => ({ key, label: t(CATEGORY_TRANSLATION_KEY[key]) }));
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDayAbbr(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return ['DI', 'LU', 'MA', 'ME', 'JE', 'VE', 'SA'][date.getDay()];
}

export default function HomeScreen() {
  const { colors, styles: themeStyles } = useAppTheme();
  const { t } = useTranslation();
  const initialCategories = getCategories(t);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyValues, setDailyValues] = useState<Record<string, Record<string, number>>>({});
  const [categories, setCategories] = useState(initialCategories);
  const [presets, setPresets] = useState<PresetHabit[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<CategoryType>('self_care');
  const [categoryProgress, setCategoryProgress] = useState<Record<CategoryType, CategoryProgress> | null>(null);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>(SCORING_CONFIG_FALLBACK);

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i);
      dates.push(toDateKey(date));
    }
    return dates;
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const weekDays = useMemo(
    () =>
      weekDates.map(date => ({
        abbr: getWeekDayAbbr(date),
        date: new Date(`${date}T12:00:00`).getDate().toString().padStart(2, '0'),
        completion: calculateDayCompletion(habits, dailyValues[date] ?? {}),
        isToday: date === todayKey,
      })),
    [dailyValues, habits, todayKey, weekDates]
  );

  const avatarScore = useMemo(() => {
    if (!categoryProgress) return 5;
    const levels = Object.fromEntries(
      CATEGORY_KEYS.map(cat => [cat, categoryProgress[cat].current_level])
    ) as Record<CategoryType, number>;
    return getAvatarScoreFromLevels(levels);
  }, [categoryProgress]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedHabits, fetchedPresets] = await Promise.all([
          fetchHabits(),
          fetchPresetHabits(),
        ]);
        setHabits(fetchedHabits);
        setPresets(fetchedPresets);

        const weekLogs: Record<string, Record<string, number>> = {};
        for (const date of weekDates) {
          weekLogs[date] = await fetchAllLogsForDate(date);
        }
        setDailyValues(weekLogs);

        const [progress, configs] = await Promise.all([
          fetchCategoryProgress().catch(() => null),
          fetchScoringConfig().catch(() => SCORING_CONFIG_FALLBACK),
        ]);
        if (progress) setCategoryProgress(progress);
        if (configs.length) setScoringConfigs(configs);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [weekDates]);

  const handleValueChange = async (habitId: string, date: string, value: number) => {
    try {
      const habit = habits.find(item => item.id === habitId);
      await logHabitValue(
        await requireUserId(),
        habitId,
        date,
        value,
        habit?.preset_habit_id ?? null,
      );
      setDailyValues(prev => ({
        ...prev,
        [date]: { ...(prev[date] ?? {}), [habitId]: value },
      }));
    } catch (error) {
      console.error('Error saving habit value:', error);
    }
  };

  const handleHabitUpdate = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const handleHabitDelete = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  const handleAddHabit = async (habitData: {
    name: string;
    emoji: string;
    category: CategoryType;
    frequency_type: FrequencyType;
    target_value: number;
    min_value: number;
    preset_habit_id: string | null;
  }) => {
    const userId = await requireUserId();
    const newHabit = await createHabit({
      ...habitData,
      user_id: userId,
      max_value: null,
      frequency_value: 1,
    });
    setHabits(prev => [...prev, newHabit]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.screen]}>
        <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const progress = categoryProgress ?? defaultAllCategoryProgress('');

  return (
    <SafeAreaView style={[styles.container, themeStyles.screen, { paddingTop: 8 }]}>
      <FlatList
        data={['hero-banner', ...categories.map(cat => cat.key)]}
        keyExtractor={item => item}
        renderItem={({ item }) => {
          if (item === 'hero-banner') {
            return (
              <HeroBanner
                avatarScore={avatarScore}
                weekDays={weekDays}
              />
            );
          }

          const category = item as CategoryType;
          const catData = categories.find(c => c.key === category);
          const categoryLabel = catData?.label ?? category;
          const catProgress = progress[category];
          const config = getScoringConfigForLevel(scoringConfigs, catProgress.current_level);
          const handleUpdateCategory = (newLabel: string) => {
            setCategories(prev =>
              prev.map(c => c.key === category ? { ...c, label: newLabel } : c)
            );
          };

          return (
            <CategorySection
              key={category}
              category={category}
              categoryLabel={categoryLabel}
              categoryLevel={catProgress.current_level}
              pointsInLevel={catProgress.points_in_level}
              pointsToNextLevel={config.points_to_next_level}
              maxHabits={config.max_habits}
              habits={habits}
              weekDates={weekDates}
              weekValues={dailyValues}
              onHabitValueChange={handleValueChange}
              onHabitUpdate={handleHabitUpdate}
              onHabitDelete={handleHabitDelete}
              onAddHabit={() => {
                setAddModalCategory(category);
                setAddModalVisible(true);
              }}
              onUpdateCategory={handleUpdateCategory}
            />
          );
        }}
        scrollEnabled={true}
        contentContainerStyle={[styles.scrollContent, themeStyles.screen]}
      />
      <AddHabitModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddHabit}
        presets={presets}
        defaultCategory={addModalCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
});
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: index.tsx — load category_progress, wire avatarScore, per-category add habit"
```

---

## Task 12: app/(tabs)/profile.tsx — nouveau UI

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Réécrire `app/(tabs)/profile.tsx`**

```typescript
// app/(tabs)/profile.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/avatar';
import { AccessoryIcon } from '@/components/accessory-icon';
import {
  ACCESSORY_LABELS,
  CATEGORY_CURRENCY_NAMES,
  getAccessoryTierLabel,
} from '@/lib/accessoires';
import { CategoryType, CATEGORY_KEYS, ScoringConfig } from '@/lib/types';
import { fetchCategoryProgress, defaultAllCategoryProgress } from '@/lib/category-progress';
import { fetchScoringConfig, getScoringConfigForLevel, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import { getAvatarScoreFromLevels } from '@/lib/avatar-level';
import type { CategoryProgress } from '@/lib/types';

const CATEGORY_ACCENT: Record<CategoryType, string> = {
  self_care:     '#4caf50',
  dev_perso:     '#ba68c8',
  vie_familiale: '#ef5350',
  vie_pro:       '#42a5f5',
};

export default function ProfileScreen() {
  const { colors, styles: themeStyles } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [categoryProgress, setCategoryProgress] = useState<Record<CategoryType, CategoryProgress> | null>(null);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>(SCORING_CONFIG_FALLBACK);

  useEffect(() => {
    const load = async () => {
      try {
        const [progress, configs] = await Promise.all([
          fetchCategoryProgress().catch(() => null),
          fetchScoringConfig().catch(() => SCORING_CONFIG_FALLBACK),
        ]);
        if (progress) setCategoryProgress(progress);
        if (configs.length) setScoringConfigs(configs);
      } catch (e) {
        console.error('Profile load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const progress = categoryProgress ?? defaultAllCategoryProgress('');

  const avatarScore = useMemo(() => {
    const levels = Object.fromEntries(
      CATEGORY_KEYS.map(cat => [cat, progress[cat].current_level])
    ) as Record<CategoryType, number>;
    return getAvatarScoreFromLevels(levels);
  }, [progress]);

  const wolfLevel = useMemo(() => {
    const levels = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
    const labels = ['N1','N1+','N2','N2+','N3','N3+','N4','N4+','N5','N5'];
    const idx = levels.findIndex(l => avatarScore <= l);
    return labels[idx >= 0 ? idx : labels.length - 1];
  }, [avatarScore]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, themeStyles.screen]}>
        <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, themeStyles.screen]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Avatar zone ── */}
        <View style={[styles.avatarZone, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatarGlow, { backgroundColor: colors.tint + '12' }]} />
          <Avatar score={avatarScore} size="large" />
          <ThemedText style={[styles.wolfLevelLabel, { color: colors.textMuted }]}>
            Loup · {wolfLevel}
          </ThemedText>
        </View>

        {/* ── 2×2 accessory grid ── */}
        <View style={styles.grid}>
          {CATEGORY_KEYS.map((cat, idx) => {
            const catProgress = progress[cat];
            const config = getScoringConfigForLevel(scoringConfigs, catProgress.current_level);
            const accent = CATEGORY_ACCENT[cat];
            const currencyName = CATEGORY_CURRENCY_NAMES[cat];
            const tierLabel = getAccessoryTierLabel(catProgress.current_level);
            const accLabel = ACCESSORY_LABELS[cat];
            const ptsDisplay = `${Math.floor(catProgress.points_in_level)} pts de ${currencyName}`;
            const levelDisplay = `N${catProgress.current_level} · ${tierLabel}`;

            return (
              <View
                key={cat}
                style={[
                  styles.gridCell,
                  {
                    borderRightWidth: idx % 2 === 0 ? 1 : 0,
                    borderBottomWidth: idx < 2 ? 1 : 0,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <View style={styles.cellIconWrapper}>
                  <AccessoryIcon
                    category={cat}
                    level={catProgress.current_level}
                    size={80}
                  />
                </View>

                <View style={styles.cellMeta}>
                  <ThemedText style={[styles.cellName, { color: accent }]}>
                    {accLabel}
                  </ThemedText>
                  <ThemedText style={[styles.cellPts, { color: accent }]}>
                    {ptsDisplay}
                  </ThemedText>
                  <ThemedText style={[styles.cellTier, { color: colors.textSubtle }]}>
                    {levelDisplay}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 40 },
  avatarZone: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    gap: 8,
  },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    width: 220,
    height: 220,
    borderRadius: 110,
    alignSelf: 'center',
  },
  wolfLevelLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: '50%', padding: 16, alignItems: 'center', gap: 10 },
  cellIconWrapper: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  cellMeta: { width: '100%', gap: 3, alignItems: 'center' },
  cellName: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  cellPts: { fontSize: 12, fontWeight: '700' },
  cellTier: { fontSize: 9 },
});
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat(ui): profile — grille sans %, affiche points+niveau, avatar zone sans XP bar"
```

---

## Task 13: Nettoyage — supprimer les fichiers momentum

**Files:**
- Delete: `lib/momentum-db.ts`
- Delete: `lib/momentum.ts`

- [ ] **Step 1: Vérifier qu'aucun fichier n'importe encore momentum-db ou momentum**

```bash
grep -r "momentum-db\|from.*momentum'" --include="*.ts" --include="*.tsx" lib/ app/ components/ | grep -v ".test."
```

Expected: aucun résultat (si résultat, corriger ces imports avant de supprimer).

- [ ] **Step 2: Supprimer les fichiers**

```bash
rm lib/momentum-db.ts lib/momentum.ts
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 4: Lancer tous les tests**

```bash
npx jest --no-coverage
```

Expected: tous les tests passent.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: remove momentum-db.ts and momentum.ts (replaced by category-progress and accessoires)"
```

---

## Vérification finale

- [ ] Lancer l'app et vérifier visuellement :
  - Page check-in : bouton `+` dans chaque catégorie, affichage "X pts de Paille · N1 · Palier 1/5", overlay accessoire
  - Page profil : grille 2×2 sans barres de progression, avatar avec "Loup · N1", pas de %
  - Ajouter une habitude depuis le bouton `+` d'une catégorie → modal pré-sélectionné sur la bonne catégorie
  - Atteindre la limite (2 habitudes au N1) → bouton `+` affiche toast

```bash
npx expo start
```

- [ ] Commit de tag

```bash
git tag v-point-system-v1
```
