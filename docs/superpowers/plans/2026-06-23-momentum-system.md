# Momentum System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement per-category EMA momentum that drives accessory tier selection and an overlay visual on the check-in screen, persisted via a nightly Supabase Edge Function.

**Architecture:** A pure-TS calculation layer (`lib/momentum.ts`) computes EMA + overlay state from stored momentum values. A `category_momentum` Supabase table holds one row per user, updated nightly by an Edge Function. The client reads this row on app open and passes `momentum` values down to `AccessoryIcon` (replacing the current `completionPct` prop).

**Tech Stack:** React Native/Expo, Supabase (Postgres + Edge Functions/Deno), Jest, TypeScript.

---

## Spec clarifications (answered before implementation)

- **`calculateWeeklyScore()` error/null** → The edge function inlines its own scoring logic (no cross-import with the RN app). If a user has no habits in a category, score defaults to 0 — EMA just decays gently. No crash.
- **Fallback SVG** → Momentum is clamped [0, 100] before any SVG lookup. Tier 0 (range 0-20) always has a file for every category. No additional fallback path needed.
- **Animations** → Out of scope (YAGNI). Overlay height/color changes are instant; `Animated` API can be added later.

---

## File map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260623_add_momentum.sql` | Schema + RLS for `category_momentum` |
| Create | `lib/momentum.ts` | Pure EMA/decay/tier/overlay calculations + types |
| Create | `lib/momentum.test.ts` | Unit tests for `lib/momentum.ts` |
| Create | `lib/momentum-db.ts` | Supabase read of `category_momentum` |
| Create | `supabase/functions/update-momentum/index.ts` | Nightly Edge Function (Deno) |
| Modify | `components/accessory-icon.tsx` | Rename `completionPct→momentum`, add optional overlay |
| Modify | `app/(tabs)/profile.tsx` | Fetch momentum from DB, pass to grid |
| Modify | `app/(tabs)/index.tsx` | Fetch momentum from DB, pass to CategorySection |
| Modify | `components/category-section.tsx` | Accept `momentum`+`momentumTrend`, render overlay |

---

## Task 1: SQL Migration — `category_momentum` table

**Files:**
- Create: `supabase/migrations/20260623_add_momentum.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260623_add_momentum.sql
CREATE TABLE IF NOT EXISTS public.category_momentum (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  momentum_selfcare FLOAT NOT NULL DEFAULT 0,
  momentum_devperso FLOAT NOT NULL DEFAULT 0,
  momentum_famille  FLOAT NOT NULL DEFAULT 0,
  momentum_pro      FLOAT NOT NULL DEFAULT 0,
  trend_selfcare    TEXT  NOT NULL DEFAULT 'stable'
    CHECK (trend_selfcare    IN ('up', 'down', 'stable')),
  trend_devperso    TEXT  NOT NULL DEFAULT 'stable'
    CHECK (trend_devperso    IN ('up', 'down', 'stable')),
  trend_famille     TEXT  NOT NULL DEFAULT 'stable'
    CHECK (trend_famille     IN ('up', 'down', 'stable')),
  trend_pro         TEXT  NOT NULL DEFAULT 'stable'
    CHECK (trend_pro         IN ('up', 'down', 'stable')),
  last_updated      DATE  NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT category_momentum_pkey PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS category_momentum_user_idx
  ON public.category_momentum(user_id);

ALTER TABLE public.category_momentum ENABLE ROW LEVEL SECURITY;

-- Authenticated users read/write their own row
CREATE POLICY category_momentum_select ON public.category_momentum
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY category_momentum_insert ON public.category_momentum
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY category_momentum_update ON public.category_momentum
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY category_momentum_delete ON public.category_momentum
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Edge function (service_role) can update any row
CREATE POLICY category_momentum_service_all ON public.category_momentum
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Apply the migration in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor, paste and run the migration. Verify:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'category_momentum';
-- Should list 10 columns
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260623_add_momentum.sql
git commit -m "feat: add category_momentum table with RLS"
```

---

## Task 2: Pure calculations — `lib/momentum.ts` (TDD)

**Files:**
- Create: `lib/momentum.ts`
- Create: `lib/momentum.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/momentum.test.ts
import {
  applyEMA,
  applyDecay,
  applyAcceleratedDecay,
  determineTier,
  getOverlayHeight,
  getOverlayColor,
  getAccessoryDisplayState,
  computeUpdatedMomentum,
  MOMENTUM_ALPHA,
} from './momentum';

// ── applyEMA ────────────────────────────────────────────────────────────────
describe('applyEMA', () => {
  it('first day: momentum=0, score=100 → 30', () => {
    expect(applyEMA(0, 100)).toBeCloseTo(30);
  });
  it('stable: momentum=50, score=50 → 50', () => {
    expect(applyEMA(50, 50)).toBeCloseTo(50);
  });
  it('declining: momentum=100, score=0 → 70', () => {
    expect(applyEMA(100, 0)).toBeCloseTo(70);
  });
  it('custom alpha overrides default', () => {
    expect(applyEMA(0, 100, 0.5)).toBeCloseTo(50);
  });
});

// ── applyDecay ──────────────────────────────────────────────────────────────
describe('applyDecay', () => {
  it('0 days absent → no change', () => {
    expect(applyDecay(60, 0)).toBeCloseTo(60);
  });
  it('1 day absent → multiply by (1 - 0.3) = 0.7', () => {
    expect(applyDecay(100, 1)).toBeCloseTo(70);
  });
  it('3 days absent → multiply by 0.7^3 ≈ 0.343', () => {
    expect(applyDecay(100, 3)).toBeCloseTo(34.3, 0);
  });
});

// ── applyAcceleratedDecay ───────────────────────────────────────────────────
describe('applyAcceleratedDecay', () => {
  it('0 days → no change', () => {
    expect(applyAcceleratedDecay(60, 0)).toBeCloseTo(60);
  });
  it('1 day: (1 - 0.3*2)^1 = 0.4 → result = 40', () => {
    expect(applyAcceleratedDecay(100, 1)).toBeCloseTo(40);
  });
  it('result is clamped to 0 even with extreme days', () => {
    expect(applyAcceleratedDecay(100, 50)).toBeGreaterThanOrEqual(0);
  });
});

// ── determineTier ───────────────────────────────────────────────────────────
describe('determineTier', () => {
  it('0 → tier 0',   () => expect(determineTier(0)).toBe(0));
  it('20 → tier 0',  () => expect(determineTier(20)).toBe(0));
  it('21 → tier 1',  () => expect(determineTier(21)).toBe(1));
  it('40 → tier 1',  () => expect(determineTier(40)).toBe(1));
  it('41 → tier 2',  () => expect(determineTier(41)).toBe(2));
  it('60 → tier 2',  () => expect(determineTier(60)).toBe(2));
  it('61 → tier 3',  () => expect(determineTier(61)).toBe(3));
  it('80 → tier 3',  () => expect(determineTier(80)).toBe(3));
  it('81 → tier 4',  () => expect(determineTier(81)).toBe(4));
  it('100 → tier 4', () => expect(determineTier(100)).toBe(4));
});

// ── getOverlayHeight ────────────────────────────────────────────────────────
describe('getOverlayHeight', () => {
  it('momentum=0   → overlayHeight=100', () => expect(getOverlayHeight(0)).toBe(100));
  it('momentum=50  → overlayHeight=50',  () => expect(getOverlayHeight(50)).toBe(50));
  it('momentum=100 → overlayHeight=0',   () => expect(getOverlayHeight(100)).toBe(0));
  it('momentum=75  → overlayHeight=25',  () => expect(getOverlayHeight(75)).toBe(25));
});

// ── getOverlayColor ─────────────────────────────────────────────────────────
describe('getOverlayColor', () => {
  const GREY = 'rgba(128, 128, 128, 0.6)';
  const RED  = 'rgba(255, 0, 0, 0.6)';

  it('trend stable → grey', () => {
    expect(getOverlayColor(50, 'stable')).toBe(GREY);
  });
  it('trend up → grey', () => {
    expect(getOverlayColor(50, 'up')).toBe(GREY);
  });
  it('trend down, distance=2 (< 10) → red  (momentum=22, 22%20=2)', () => {
    expect(getOverlayColor(22, 'down')).toBe(RED);
  });
  it('trend down, distance=15 (>= 10) → grey (momentum=55, 55%20=15)', () => {
    expect(getOverlayColor(55, 'down')).toBe(GREY);
  });
  it('trend down, distance=10 (== 10) → grey (momentum=30, 30%20=10)', () => {
    expect(getOverlayColor(30, 'down')).toBe(GREY);
  });
  it('trend down, distance=9 (< 10) → red  (momentum=29, 29%20=9)', () => {
    expect(getOverlayColor(29, 'down')).toBe(RED);
  });
});

// ── computeUpdatedMomentum ──────────────────────────────────────────────────
describe('computeUpdatedMomentum', () => {
  it('first day score=80, previous=0 → momentum ≈ 24', () => {
    const { momentum } = computeUpdatedMomentum(0, 80, 0);
    expect(momentum).toBeCloseTo(24, 0);
  });
  it('stable: previous=50, score=50 → trend=stable', () => {
    const { trend } = computeUpdatedMomentum(50, 50, 0);
    expect(trend).toBe('stable');
  });
  it('improving: previous=20, score=100 → trend=up', () => {
    // EMA: 0.3*100 + 0.7*20 = 44 > 20+1
    const { trend } = computeUpdatedMomentum(20, 100, 0);
    expect(trend).toBe('up');
  });
  it('declining: previous=80, score=0 → trend=down', () => {
    // EMA: 0.3*0 + 0.7*80 = 56 < 80-1
    const { trend } = computeUpdatedMomentum(80, 0, 0);
    expect(trend).toBe('down');
  });
  it('3 days absent, score=0 → applies decay before EMA', () => {
    // previous=60, decay: 60 * 0.7^3 ≈ 20.6; EMA: 0.3*0 + 0.7*20.6 ≈ 14.4
    const { momentum } = computeUpdatedMomentum(60, 0, 3);
    expect(momentum).toBeLessThan(25);
    expect(momentum).toBeGreaterThanOrEqual(0);
  });
  it('result is clamped [0, 100]', () => {
    const { momentum: low } = computeUpdatedMomentum(0, 0, 100);
    const { momentum: high } = computeUpdatedMomentum(100, 100, 0);
    expect(low).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(100);
  });
});

// ── getAccessoryDisplayState ────────────────────────────────────────────────
describe('getAccessoryDisplayState', () => {
  it('self_care momentum=10, stable → tier=0, svg=antre.0-20.svg, overlay=90%, grey', () => {
    const s = getAccessoryDisplayState('self_care', 10, 'stable');
    expect(s.tier).toBe(0);
    expect(s.svgFileName).toBe('antre.0-20.svg');
    expect(s.overlayHeight).toBe(90);
    expect(s.overlayColor).toBe('rgba(128, 128, 128, 0.6)');
  });
  it('dev_perso momentum=100, up → tier=4, svg=cri.81-100.svg, overlay=0%', () => {
    const s = getAccessoryDisplayState('dev_perso', 100, 'up');
    expect(s.tier).toBe(4);
    expect(s.svgFileName).toBe('cri.81-100.svg');
    expect(s.overlayHeight).toBe(0);
  });
  it('vie_familiale momentum=50, stable → tier=2, svg=meute.41-60.svg', () => {
    const s = getAccessoryDisplayState('vie_familiale', 50, 'stable');
    expect(s.tier).toBe(2);
    expect(s.svgFileName).toBe('meute.41-60.svg');
  });
  it('vie_pro momentum=29, down → red overlay (distance to threshold = 9)', () => {
    const s = getAccessoryDisplayState('vie_pro', 29, 'down');
    expect(s.overlayColor).toBe('rgba(255, 0, 0, 0.6)');
  });
  it('clamps momentum > 100', () => {
    const s = getAccessoryDisplayState('self_care', 150, 'stable');
    expect(s.tier).toBe(4);
    expect(s.overlayHeight).toBe(0);
  });
  it('clamps momentum < 0', () => {
    const s = getAccessoryDisplayState('self_care', -10, 'stable');
    expect(s.tier).toBe(0);
    expect(s.overlayHeight).toBe(100);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest lib/momentum.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module './momentum'`

- [ ] **Step 3: Implement `lib/momentum.ts`**

```typescript
// lib/momentum.ts
import { CategoryType } from './types';
import { getAccessoryFileName } from './accessoires';

export type MomentumTrend = 'up' | 'down' | 'stable';

export interface AccessoryDisplayState {
  tier: number;
  svgFileName: string;
  overlayHeight: number;
  overlayColor: string;
}

export const MOMENTUM_ALPHA = 0.3;

const OVERLAY_GREY = 'rgba(128, 128, 128, 0.6)';
const OVERLAY_RED  = 'rgba(255, 0, 0, 0.6)';

export function applyEMA(
  previous: number,
  todayScore: number,
  alpha = MOMENTUM_ALPHA,
): number {
  return alpha * todayScore + (1 - alpha) * previous;
}

export function applyDecay(momentum: number, daysAbsent: number, alpha = MOMENTUM_ALPHA): number {
  return momentum * Math.pow(1 - alpha, daysAbsent);
}

export function applyAcceleratedDecay(
  momentum: number,
  daysOverThreshold: number,
  alpha = MOMENTUM_ALPHA,
): number {
  return Math.max(0, momentum * Math.pow(1 - alpha * 2, daysOverThreshold));
}

export function determineTier(momentum: number): number {
  if (momentum <= 20) return 0;
  if (momentum <= 40) return 1;
  if (momentum <= 60) return 2;
  if (momentum <= 80) return 3;
  return 4;
}

export function getOverlayHeight(momentum: number): number {
  return Math.round(100 * (1 - momentum / 100));
}

export function getOverlayColor(momentum: number, trend: MomentumTrend): string {
  if (trend === 'down' && momentum % 20 < 10) return OVERLAY_RED;
  return OVERLAY_GREY;
}

export function getAccessoryDisplayState(
  category: CategoryType,
  momentum: number,
  trend: MomentumTrend,
): AccessoryDisplayState {
  const m = Math.max(0, Math.min(100, momentum));
  return {
    tier:          determineTier(m),
    svgFileName:   getAccessoryFileName(category, m),
    overlayHeight: getOverlayHeight(m),
    overlayColor:  getOverlayColor(m, trend),
  };
}

export function computeUpdatedMomentum(
  previous: number,
  todayScore: number,
  daysAbsent: number,
): { momentum: number; trend: MomentumTrend } {
  let base = previous;
  if (daysAbsent > 0) {
    base = applyDecay(previous, daysAbsent);
  }
  const updated = applyEMA(base, todayScore);
  const rounded = Math.max(0, Math.min(100, Math.round(updated * 10) / 10));
  const trend: MomentumTrend =
    rounded > previous + 1 ? 'up' :
    rounded < previous - 1 ? 'down' :
    'stable';
  return { momentum: rounded, trend };
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npx jest lib/momentum.test.ts --no-coverage
```

Expected output: `Tests: 30 passed` (all green, no failures).

- [ ] **Step 5: Commit**

```bash
git add lib/momentum.ts lib/momentum.test.ts
git commit -m "feat: add momentum calculation engine with EMA, decay, and overlay state"
```

---

## Task 3: DB access — `lib/momentum-db.ts`

**Files:**
- Create: `lib/momentum-db.ts`

- [ ] **Step 1: Create the DB access module**

Follows the exact same pattern as `lib/habit-logs.ts` (ensureSupabase, requireUserId, maybeSingle).

```typescript
// lib/momentum-db.ts
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { requireUserId } from './auth';
import type { MomentumTrend } from './momentum';

export interface MomentumRecord {
  user_id:           string;
  momentum_selfcare: number;
  momentum_devperso: number;
  momentum_famille:  number;
  momentum_pro:      number;
  trend_selfcare:    MomentumTrend;
  trend_devperso:    MomentumTrend;
  trend_famille:     MomentumTrend;
  trend_pro:         MomentumTrend;
  last_updated:      string;
}

function ensureSupabase() {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE);
  return supabase;
}

export function defaultMomentumRecord(userId: string): MomentumRecord {
  return {
    user_id:           userId,
    momentum_selfcare: 0,
    momentum_devperso: 0,
    momentum_famille:  0,
    momentum_pro:      0,
    trend_selfcare:    'stable',
    trend_devperso:    'stable',
    trend_famille:     'stable',
    trend_pro:         'stable',
    last_updated:      new Date().toISOString().split('T')[0],
  };
}

export async function fetchMomentum(userId?: string): Promise<MomentumRecord | null> {
  const client = ensureSupabase();
  const uid = userId ?? (await requireUserId());
  const { data, error } = await client
    .from('category_momentum')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;
  return (data as MomentumRecord) ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/momentum-db.ts
git commit -m "feat: add momentum-db module for reading category_momentum from Supabase"
```

---

## Task 4: Supabase Edge Function — nightly momentum update

**Files:**
- Create: `supabase/functions/update-momentum/index.ts`

- [ ] **Step 1: Create the edge function**

```typescript
// supabase/functions/update-momentum/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALPHA = 0.3;

function applyEMA(previous: number, todayScore: number): number {
  return ALPHA * todayScore + (1 - ALPHA) * previous;
}

function applyDecay(momentum: number, days: number): number {
  return momentum * Math.pow(1 - ALPHA, days);
}

function determineTrend(next: number, prev: number): 'up' | 'down' | 'stable' {
  if (next > prev + 1) return 'up';
  if (next < prev - 1) return 'down';
  return 'stable';
}

function calcCategoryScore(
  habits: any[],
  weekLogs: Record<string, Record<string, number>>,
): number {
  const dates = Object.keys(weekLogs).sort();
  if (habits.length === 0 || dates.length === 0) return 0;

  const completions: number[] = [];
  for (const h of habits) {
    if (h.frequency_type === 'times_per_week') {
      const total = dates.reduce((s: number, d: string) => s + (weekLogs[d]?.[h.id] ?? 0), 0);
      completions.push(
        h.target_value === 0 ? 0 : Math.min(100, Math.round((total / h.target_value) * 100)),
      );
    } else {
      const dayScores: number[] = [];
      for (const date of dates) {
        const v = weekLogs[date]?.[h.id] ?? 0;
        let pct = 0;
        if (h.frequency_type === 'per_day') {
          if (v < h.min_value) pct = 0;
          else if (v >= h.target_value) pct = 100;
          else {
            const range = h.target_value - h.min_value;
            pct = range === 0 ? 100 : Math.round(((v - h.min_value) / range) * 100);
          }
        } else {
          pct = h.target_value === 0
            ? 0
            : Math.max(0, Math.min(100, Math.round((v / h.target_value) * 100)));
        }
        dayScores.push(pct);
      }
      completions.push(Math.round(dayScores.reduce((s, p) => s + p, 0) / dayScores.length));
    }
  }
  return Math.round(completions.reduce((s, p) => s + p, 0) / completions.length);
}

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
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400_000).toISOString().split('T')[0];

  const { data: rows } = await client.from('habits').select('user_id');
  const userIds = [...new Set((rows ?? []).map((r: any) => r.user_id as string))];

  const categories = [
    { key: 'self_care',     col: 'momentum_selfcare', trendCol: 'trend_selfcare' },
    { key: 'dev_perso',     col: 'momentum_devperso', trendCol: 'trend_devperso' },
    { key: 'vie_familiale', col: 'momentum_famille',  trendCol: 'trend_famille'  },
    { key: 'vie_pro',       col: 'momentum_pro',      trendCol: 'trend_pro'      },
  ];

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

    const { data: existing } = await client
      .from('category_momentum')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const lastUpdated: string = existing?.last_updated ?? today;
    const msPerDay = 86400_000;
    const daysAbsent = Math.max(
      0,
      Math.floor((new Date(today).getTime() - new Date(lastUpdated).getTime()) / msPerDay) - 1,
    );

    const upsertData: Record<string, any> = { user_id: userId, last_updated: today };

    for (const { key, col, trendCol } of categories) {
      const catHabits = habits.filter((h: any) => h.category === key);
      const todayScore = calcCategoryScore(catHabits, weekLogs);
      const prev: number = (existing?.[col] ?? 0) as number;

      // Normal decay for absent days; accelerated beyond 3 days with score=0
      let decayed = prev;
      if (daysAbsent > 0) {
        if (todayScore === 0 && daysAbsent > 3) {
          const normalDays = 3;
          const extraDays = daysAbsent - 3;
          decayed = applyDecay(prev, normalDays);
          decayed = Math.max(0, decayed * Math.pow(1 - ALPHA * 2, extraDays));
        } else {
          decayed = applyDecay(prev, daysAbsent);
        }
      }

      const next = Math.max(0, Math.min(100, Math.round(applyEMA(decayed, todayScore) * 10) / 10));
      upsertData[col] = next;
      upsertData[trendCol] = determineTrend(next, prev);
    }

    await client
      .from('category_momentum')
      .upsert(upsertData, { onConflict: 'user_id' });
    updated++;
  }

  return new Response(JSON.stringify({ updated, date: today }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Set the `CRON_SECRET` environment variable in Supabase**

In Supabase Dashboard → Settings → Edge Functions → Environment variables:
- Add `CRON_SECRET` with a long random value (e.g. `openssl rand -hex 32`)

- [ ] **Step 3: Deploy the edge function**

```bash
npx supabase functions deploy update-momentum --project-ref <YOUR_PROJECT_REF>
```

Expected output: `Deployed: update-momentum`

- [ ] **Step 4: Schedule the edge function at midnight UTC**

In Supabase Dashboard → Database → Extensions → enable `pg_cron` if not already enabled, then run:

```sql
SELECT cron.schedule(
  'nightly-momentum-update',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/update-momentum',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<YOUR_CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
```

Replace `<YOUR_PROJECT_REF>` and `<YOUR_CRON_SECRET>` with actual values.

- [ ] **Step 5: Manual smoke test**

```bash
curl -X POST \
  https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/update-momentum \
  -H "x-cron-secret: <YOUR_CRON_SECRET>"
```

Expected: `{"updated":N,"date":"2026-06-23"}`

Check in Dashboard → Table Editor → `category_momentum`: a row should exist for your user.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/update-momentum/index.ts
git commit -m "feat: add update-momentum edge function with EMA + accelerated decay"
```

---

## Task 5: Update `AccessoryIcon` — momentum prop + overlay

**Files:**
- Modify: `components/accessory-icon.tsx`

- [ ] **Step 1: Replace `completionPct` with `momentum`, add overlay props**

Replace the entire file content:

```typescript
// components/accessory-icon.tsx
import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { CategoryType } from '@/lib/types';
import { getAccessoryFileName } from '@/lib/accessoires';

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
  category:      CategoryType;
  momentum:      number;        // 0-100, drives SVG tier selection
  size?:         number;
  overlayHeight?: number;       // 0-100 (% of icon height to cover from top). 0 = no overlay.
  overlayColor?:  string;       // defaults to rgba(128,128,128,0.6)
}

function AccessoryIconComponent({
  category,
  momentum,
  size = 40,
  overlayHeight = 0,
  overlayColor = 'rgba(128, 128, 128, 0.6)',
}: AccessoryIconProps) {
  const uri = useMemo(() => {
    const fileName = getAccessoryFileName(category, momentum);
    const asset = ACCESSORY_ASSETS[fileName as keyof typeof ACCESSORY_ASSETS];
    return asset ? Asset.fromModule(asset).uri : null;
  }, [category, momentum]);

  if (!uri) return <View style={[styles.container, { width: size, height: size }]} />;

  const coverPixels = Math.round((overlayHeight / 100) * size);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <SvgUri width={size} height={size} uri={uri} />
      {coverPixels > 0 && (
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            {
              height:          coverPixels,
              backgroundColor: overlayColor,
            },
          ]}
        />
      )}
    </View>
  );
}

export const AccessoryIcon = memo(AccessoryIconComponent);

const styles = StyleSheet.create({
  container: {
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  overlay: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
  },
});
```

- [ ] **Step 2: Check for TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep "accessory-icon\|momentum"
```

Expected: no errors from these files. If `completionPct` is referenced elsewhere, fix those call sites in this step.

- [ ] **Step 3: Commit**

```bash
git add components/accessory-icon.tsx
git commit -m "feat: AccessoryIcon accepts momentum + optional overlay (replaces completionPct)"
```

---

## Task 6: `profile.tsx` — fetch and display momentum from DB

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Add imports**

Add these two imports at the top of `app/(tabs)/profile.tsx`, after existing imports:

```typescript
import { fetchMomentum, defaultMomentumRecord, MomentumRecord } from '@/lib/momentum-db';
import { getAccessoryTierLabel } from '@/lib/accessoires';
```

(`getAccessoryTierLabel` is already imported — only add `fetchMomentum`, `defaultMomentumRecord`, `MomentumRecord`.)

- [ ] **Step 2: Add momentum state**

Inside `ProfileScreen`, add after the existing `useState` declarations:

```typescript
const [momentumRecord, setMomentumRecord] = useState<MomentumRecord | null>(null);
```

- [ ] **Step 3: Fetch momentum in useEffect**

Inside the existing `load` async function (inside `useEffect`), after `setWeekLogs(logs)`, add:

```typescript
const record = await fetchMomentum();
setMomentumRecord(record);
```

- [ ] **Step 4: Define the column map and update the grid**

Add this constant just before the `return` statement (after `if (loading)` block):

```typescript
const MOMENTUM_COL: Record<CategoryType, keyof MomentumRecord> = {
  self_care:     'momentum_selfcare',
  dev_perso:     'momentum_devperso',
  vie_familiale: 'momentum_famille',
  vie_pro:       'momentum_pro',
};
const TREND_COL: Record<CategoryType, keyof MomentumRecord> = {
  self_care:     'trend_selfcare',
  dev_perso:     'trend_devperso',
  vie_familiale: 'trend_famille',
  vie_pro:       'trend_pro',
};
```

Then, inside the `.map((cat, idx) => { ... })` loop, replace:

```typescript
const pct = categoryCompletions[cat];
```

with:

```typescript
const pct = categoryCompletions[cat]; // weekly score (shown as %)
const record = momentumRecord ?? defaultMomentumRecord('');
const momentum = record[MOMENTUM_COL[cat]] as number;
const tierLabel = getAccessoryTierLabel(momentum);
```

And update the `AccessoryIcon` call from:

```typescript
<AccessoryIcon category={cat} completionPct={pct} size={80} />
```

to:

```typescript
<AccessoryIcon category={cat} momentum={momentum} size={80} />
```

Also update the `tierLabel` source — it now comes from `getAccessoryTierLabel(momentum)` (computed above), not `getAccessoryTierLabel(pct)`. The existing line `const tierLabel = getAccessoryTierLabel(pct);` was using `pct`; this step replaces that line.

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "profile"
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/profile.tsx"
git commit -m "feat: profile reads momentum from DB for accessory tier display"
```

---

## Task 7: Check-in overlay — `index.tsx` + `category-section.tsx`

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `components/category-section.tsx`

### Part A: Add momentum state + fetch to `index.tsx`

- [ ] **Step 1: Add imports to `index.tsx`**

Add after existing imports:

```typescript
import { fetchMomentum, defaultMomentumRecord, MomentumRecord } from '@/lib/momentum-db';
import { getAccessoryDisplayState, MomentumTrend } from '@/lib/momentum';
```

- [ ] **Step 2: Add momentum state in `HomeScreen`**

After the `const [addModalVisible, ...]` line:

```typescript
const [momentumRecord, setMomentumRecord] = useState<MomentumRecord | null>(null);
```

- [ ] **Step 3: Fetch momentum inside `loadData`**

Inside the existing `loadData` async function, after `setDailyValues(weekLogs)`:

```typescript
const record = await fetchMomentum().catch(() => null);
setMomentumRecord(record);
```

- [ ] **Step 4: Compute per-category display state**

Add after the `categoryCompletions` useMemo:

```typescript
const MOMENTUM_COL: Record<CategoryType, keyof MomentumRecord> = {
  self_care:     'momentum_selfcare',
  dev_perso:     'momentum_devperso',
  vie_familiale: 'momentum_famille',
  vie_pro:       'momentum_pro',
};
const TREND_COL: Record<CategoryType, keyof MomentumRecord> = {
  self_care:     'trend_selfcare',
  dev_perso:     'trend_devperso',
  vie_familiale: 'trend_famille',
  vie_pro:       'trend_pro',
};

const categoryAccessoryState = useMemo(() => {
  const rec = momentumRecord ?? defaultMomentumRecord('');
  return Object.fromEntries(
    CATEGORY_KEYS.map(cat => {
      const m = rec[MOMENTUM_COL[cat]] as number;
      const t = rec[TREND_COL[cat]] as MomentumTrend;
      return [cat, getAccessoryDisplayState(cat, m, t)];
    })
  ) as Record<CategoryType, ReturnType<typeof getAccessoryDisplayState>>;
}, [momentumRecord]);
```

- [ ] **Step 5: Pass accessory state to CategorySection**

In the `renderItem` where `<CategorySection>` is returned, add two new props:

```typescript
<CategorySection
  // ...existing props...
  momentum={categoryAccessoryState[category].overlayHeight === 0
    ? (momentumRecord?.[MOMENTUM_COL[category]] as number ?? 0)
    : (momentumRecord?.[MOMENTUM_COL[category]] as number ?? 0)}
  overlayHeight={categoryAccessoryState[category].overlayHeight}
  overlayColor={categoryAccessoryState[category].overlayColor}
/>
```

Simpler: since `categoryAccessoryState[category]` already has `overlayHeight` and `overlayColor`, and we need `momentum` for the tier, destructure cleanly:

```typescript
const { overlayHeight, overlayColor, tier } = categoryAccessoryState[category];
const catMomentum = (momentumRecord ?? defaultMomentumRecord(''))[MOMENTUM_COL[category]] as number;

return (
  <CategorySection
    key={category}
    category={category}
    categoryLabel={categoryLabel}
    completionPct={categoryCompletions[category]}
    momentum={catMomentum}
    overlayHeight={overlayHeight}
    overlayColor={overlayColor}
    habits={habits}
    weekDates={weekDates}
    weekValues={dailyValues}
    onHabitValueChange={handleValueChange}
    onHabitUpdate={handleHabitUpdate}
    onHabitDelete={handleHabitDelete}
    onAddHabit={handleAddHabit}
    onUpdateCategory={handleUpdateCategory}
  />
);
```

### Part B: Update `category-section.tsx`

- [ ] **Step 6: Add new props to CategorySection**

In `components/category-section.tsx`, find the props interface (look for where `completionPct` is declared) and add:

```typescript
momentum?:      number;
overlayHeight?: number;
overlayColor?:  string;
```

In the function signature, add these with defaults:

```typescript
momentum = 0,
overlayHeight = 0,
overlayColor = 'rgba(128, 128, 128, 0.6)',
```

- [ ] **Step 7: Update AccessoryIcon call in category-section.tsx**

Find the `<AccessoryIcon` call (currently `completionPct={completionPct}`) and replace with:

```typescript
<AccessoryIcon
  category={category}
  momentum={momentum}
  size={48}
  overlayHeight={overlayHeight}
  overlayColor={overlayColor}
/>
```

- [ ] **Step 8: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -E "category-section|index\.tsx"
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add "app/(tabs)/index.tsx" components/category-section.tsx
git commit -m "feat: checkin screen shows accessory overlay driven by momentum"
```

---

## Spec coverage self-check

| Requirement | Task |
|-------------|------|
| EMA formula: α=0.3 | Task 2 `applyEMA` |
| Absence decay before EMA | Task 2 `applyDecay` in `computeUpdatedMomentum` |
| Accelerated decay after 3 days | Task 2 `applyAcceleratedDecay` + Task 4 edge fn |
| 5 tiers based on momentum | Task 2 `determineTier` |
| Overlay height = 100*(1 - momentum/100) | Task 2 `getOverlayHeight` |
| Grey overlay | Task 2 `getOverlayColor` (stable/up path) |
| Red overlay near threshold when declining | Task 2 `getOverlayColor` (down + distance<10) |
| `category_momentum` table + RLS | Task 1 |
| service_role bypass for edge fn | Task 1 (service_role policy) |
| Edge function at midnight UTC | Task 4 (pg_cron schedule) |
| `CRON_SECRET` auth on edge fn | Task 4 |
| Client reads momentum on app open | Tasks 6 + 7 |
| Profile: accessory without overlay | Task 6 (no overlayHeight passed) |
| Check-in: accessory with grey/red overlay | Task 7 |
| `getAccessoryDisplayState` function | Task 2 |
| Types: `MomentumTrend`, `AccessoryDisplayState`, `MomentumRecord` | Tasks 2 + 3 |
| No permanent winner — momentum decays | Task 2 + 4 (EMA never reaches 100 permanently) |

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-23-momentum-system.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session with executing-plans, batch with checkpoints

**Which approach?**
