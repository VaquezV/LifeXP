# Sanctuaire Page + Progression Elements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the "Profil" page to "Sanctuaire" and add a derived sub-system that shows, per category, which visual milestone elements are unlocked within the current level — without touching the existing scoring/tier/level engine.

**Architecture:** Two new pure-logic files in `lib/` (a static per-category/per-level element config, and pure threshold/derivation functions operating on the existing `category_progress`/`scoring_config` data), two new presentational components in `components/profile-redesign/`, and a small wiring change in the existing `profile.tsx` page and tab layout. No new Supabase tables, no changes to `lib/avatar-level.ts`, `lib/wolf-data.ts`, or `lib/scoring-config.ts`.

**Tech Stack:** TypeScript, React Native / Expo Router, Jest + jest-expo + react-test-renderer (no `@testing-library/react-native` in this project — do not add it).

**Spec:** `docs/superpowers/specs/2026-08-02-sanctuaire-progression-design.md`

---

### Task 1: Add `ProgressionElement` type

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add the type**

Add at the end of `lib/types.ts` (after the `CategoryProgress` interface, line 100):

```ts

export type ProgressionElement = {
  id: string;
  label: string;
  alt: string;
  description?: string;
  assetPath?: string;
  order: number;
  family?: string;
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors (the type is unused so far, which is fine — nothing imports it yet).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add ProgressionElement type"
```

---

### Task 2: Threshold formula and level-max clamp (pure math, no config yet)

**Files:**
- Create: `lib/category-elements.ts`
- Test: `lib/category-elements.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/category-elements.test.ts`:

```ts
// lib/category-elements.test.ts
import { getElementThresholds, getPointsWithinCurrentLevel } from './category-elements';

describe('getElementThresholds', () => {
  it('1 élément', () => {
    expect(getElementThresholds(50, 1)).toEqual([25]);
  });

  it('2 éléments, coût divisible (75)', () => {
    expect(getElementThresholds(75, 2)).toEqual([25, 50]);
  });

  it('3 éléments, coût non divisible (50)', () => {
    expect(getElementThresholds(50, 3)).toEqual([13, 25, 38]);
  });

  it('4 éléments, coût divisible (100)', () => {
    expect(getElementThresholds(100, 4)).toEqual([20, 40, 60, 80]);
  });

  it('5 éléments (coût réel niveau 5 = 140)', () => {
    expect(getElementThresholds(140, 5)).toEqual([24, 47, 70, 94, 117]);
  });

  it('0 point de coût → tous les seuils valent 0', () => {
    expect(getElementThresholds(0, 3)).toEqual([0, 0, 0]);
  });

  it('0 élément → liste vide', () => {
    expect(getElementThresholds(85, 0)).toEqual([]);
  });

  it('la séquence est strictement croissante pour un coût non nul', () => {
    const thresholds = getElementThresholds(85, 3);
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }
  });

  it('le dernier seuil est strictement inférieur au coût total', () => {
    for (const [cost, count] of [[75, 2], [100, 4], [50, 3], [140, 5], [85, 1]] as const) {
      const thresholds = getElementThresholds(cost, count);
      expect(thresholds[thresholds.length - 1]).toBeLessThan(cost);
    }
  });
});

describe('getPointsWithinCurrentLevel', () => {
  it('retourne pointsInLevel tel quel sous le coût du niveau', () => {
    expect(getPointsWithinCurrentLevel(40, 85)).toBe(40);
  });

  it('plafonne au coût du niveau si pointsInLevel le dépasse (niveau max qui continue à accumuler)', () => {
    expect(getPointsWithinCurrentLevel(200, 140)).toBe(140);
  });

  it('seuil exact reste inchangé', () => {
    expect(getPointsWithinCurrentLevel(85, 85)).toBe(85);
  });

  it('zéro point', () => {
    expect(getPointsWithinCurrentLevel(0, 85)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest lib/category-elements.test.ts`
Expected: FAIL — `Cannot find module './category-elements'`

- [ ] **Step 3: Implement the minimal code**

Create `lib/category-elements.ts`:

```ts
// lib/category-elements.ts

export function getElementThresholds(costToNextLevel: number, elementCount: number): number[] {
  if (elementCount <= 0) return [];
  const segments = elementCount + 1;
  return Array.from({ length: elementCount }, (_, i) =>
    Math.ceil(((i + 1) * costToNextLevel) / segments)
  );
}

export function getPointsWithinCurrentLevel(pointsInLevel: number, pointsToNextLevel: number): number {
  return Math.min(pointsInLevel, pointsToNextLevel);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest lib/category-elements.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/category-elements.ts lib/category-elements.test.ts
git commit -m "feat: add element threshold formula and level-max clamp"
```

---

### Task 3: Per-category / per-level element configuration

**Files:**
- Create: `lib/category-elements-config.ts`

- [ ] **Step 1: Create the config file**

Create `lib/category-elements-config.ts`:

```ts
// lib/category-elements-config.ts
// Libellés provisoires (assets réels pas encore générés — voir assets/icones_accessoires/).
// Modifier cette configuration ne doit jamais nécessiter de toucher lib/category-elements.ts
// ni les composants d'affichage.
import type { CategoryType, ProgressionElement } from './types';

type LevelElementsMap = Record<number, ProgressionElement[]>;

export const CATEGORY_ELEMENTS_CONFIG: Record<CategoryType, LevelElementsMap> = {
  self_care: {
    1: [
      { id: 'self_care-l1-1', label: 'Paille sèche', alt: 'Paille sèche', order: 1 },
    ],
    2: [
      { id: 'self_care-l2-1', label: 'Herbes coupées', alt: 'Herbes coupées', order: 1 },
      { id: 'self_care-l2-2', label: 'Petit foyer', alt: 'Petit foyer', order: 2 },
    ],
    3: [
      { id: 'self_care-l3-1', label: 'Herbes fraîches', alt: 'Herbes fraîches', order: 1 },
      { id: 'self_care-l3-2', label: 'Foyer de pierres', alt: 'Foyer de pierres', order: 2 },
      { id: 'self_care-l3-3', label: "Rune de l'Antre I", alt: "Rune de l'Antre I", order: 3, family: 'rune' },
    ],
    4: [
      { id: 'self_care-l4-1', label: 'Mousse', alt: 'Mousse', order: 1 },
      { id: 'self_care-l4-2', label: 'Brasero', alt: 'Brasero', order: 2 },
      { id: 'self_care-l4-3', label: 'Source', alt: 'Source', order: 3 },
      { id: 'self_care-l4-4', label: "Rune de l'Antre II", alt: "Rune de l'Antre II", order: 4, family: 'rune' },
    ],
    5: [
      { id: 'self_care-l5-1', label: 'Plumes douces', alt: 'Plumes douces', order: 1 },
      { id: 'self_care-l5-2', label: 'Flamme sacrée', alt: 'Flamme sacrée', order: 2 },
      { id: 'self_care-l5-3', label: 'Cascade', alt: 'Cascade', order: 3 },
      { id: 'self_care-l5-4', label: 'Arbre ancien', alt: 'Arbre ancien', order: 4 },
      { id: 'self_care-l5-5', label: "Rune de l'Antre III", alt: "Rune de l'Antre III", order: 5, family: 'rune' },
    ],
  },
  dev_perso: {
    1: [
      { id: 'dev_perso-l1-1', label: 'Moustaches naissantes', alt: 'Moustaches naissantes', order: 1 },
    ],
    2: [
      { id: 'dev_perso-l2-1', label: 'Moustaches allongées', alt: 'Moustaches allongées', order: 1 },
      { id: 'dev_perso-l2-2', label: 'Premiers crocs', alt: 'Premiers crocs', order: 2 },
    ],
    3: [
      { id: 'dev_perso-l3-1', label: 'Moustaches épaisses', alt: 'Moustaches épaisses', order: 1 },
      { id: 'dev_perso-l3-2', label: 'Crocs développés', alt: 'Crocs développés', order: 2 },
      { id: 'dev_perso-l3-3', label: 'Rune du Souffle I', alt: 'Rune du Souffle I', order: 3, family: 'rune' },
    ],
    4: [
      { id: 'dev_perso-l4-1', label: 'Moustaches nobles', alt: 'Moustaches nobles', order: 1 },
      { id: 'dev_perso-l4-2', label: 'Crocs aiguisés', alt: 'Crocs aiguisés', order: 2 },
      { id: 'dev_perso-l4-3', label: 'Souffle puissant', alt: 'Souffle puissant', order: 3 },
      { id: 'dev_perso-l4-4', label: 'Rune du Souffle II', alt: 'Rune du Souffle II', order: 4, family: 'rune' },
    ],
    5: [
      { id: 'dev_perso-l5-1', label: 'Moustaches ancestrales', alt: 'Moustaches ancestrales', order: 1 },
      { id: 'dev_perso-l5-2', label: 'Crocs sacrés', alt: 'Crocs sacrés', order: 2 },
      { id: 'dev_perso-l5-3', label: 'Souffle sacré', alt: 'Souffle sacré', order: 3 },
      { id: 'dev_perso-l5-4', label: 'Voix du Gardien', alt: 'Voix du Gardien', order: 4 },
      { id: 'dev_perso-l5-5', label: 'Rune du Souffle III', alt: 'Rune du Souffle III', order: 5, family: 'rune' },
    ],
  },
  vie_familiale: {
    1: [
      { id: 'vie_familiale-l1-1', label: 'Regard bienveillant', alt: 'Regard bienveillant', order: 1 },
    ],
    2: [
      { id: 'vie_familiale-l2-1', label: 'Regard complice', alt: 'Regard complice', order: 1 },
      { id: 'vie_familiale-l2-2', label: 'Queue expressive', alt: 'Queue expressive', order: 2 },
    ],
    3: [
      { id: 'vie_familiale-l3-1', label: 'Toilettage', alt: 'Toilettage', order: 1 },
      { id: 'vie_familiale-l3-2', label: 'Premier hurlement', alt: 'Premier hurlement', order: 2 },
      { id: 'vie_familiale-l3-3', label: 'Rune du Lien I', alt: 'Rune du Lien I', order: 3, family: 'rune' },
    ],
    4: [
      { id: 'vie_familiale-l4-1', label: 'Protection', alt: 'Protection', order: 1 },
      { id: 'vie_familiale-l4-2', label: 'Hurlement de meute', alt: 'Hurlement de meute', order: 2 },
      { id: 'vie_familiale-l4-3', label: 'Feu commun', alt: 'Feu commun', order: 3 },
      { id: 'vie_familiale-l4-4', label: 'Rune du Lien II', alt: 'Rune du Lien II', order: 4, family: 'rune' },
    ],
    5: [
      { id: 'vie_familiale-l5-1', label: 'Transmission', alt: 'Transmission', order: 1 },
      { id: 'vie_familiale-l5-2', label: 'Chant de meute', alt: 'Chant de meute', order: 2 },
      { id: 'vie_familiale-l5-3', label: 'Refuge collectif', alt: 'Refuge collectif', order: 3 },
      { id: 'vie_familiale-l5-4', label: 'Cercle de la meute', alt: 'Cercle de la meute', order: 4 },
      { id: 'vie_familiale-l5-5', label: 'Rune du Lien III', alt: 'Rune du Lien III', order: 5, family: 'rune' },
    ],
  },
  vie_pro: {
    1: [
      { id: 'vie_pro-l1-1', label: 'Galet', alt: 'Galet', order: 1 },
    ],
    2: [
      { id: 'vie_pro-l2-1', label: 'Pierre polie', alt: 'Pierre polie', order: 1 },
      { id: 'vie_pro-l2-2', label: 'Étincelle', alt: 'Étincelle', order: 2 },
    ],
    3: [
      { id: 'vie_pro-l3-1', label: 'Menhir', alt: 'Menhir', order: 1 },
      { id: 'vie_pro-l3-2', label: 'Lueur', alt: 'Lueur', order: 2 },
      { id: 'vie_pro-l3-3', label: "Rune de l'Influence I", alt: "Rune de l'Influence I", order: 3, family: 'rune' },
    ],
    4: [
      { id: 'vie_pro-l4-1', label: 'Monolithe', alt: 'Monolithe', order: 1 },
      { id: 'vie_pro-l4-2', label: 'Cristal', alt: 'Cristal', order: 2 },
      { id: 'vie_pro-l4-3', label: 'Halo', alt: 'Halo', order: 3 },
      { id: 'vie_pro-l4-4', label: "Rune de l'Influence II", alt: "Rune de l'Influence II", order: 4, family: 'rune' },
    ],
    5: [
      { id: 'vie_pro-l5-1', label: 'Stèle sacrée', alt: 'Stèle sacrée', order: 1 },
      { id: 'vie_pro-l5-2', label: 'Cristal ancien', alt: 'Cristal ancien', order: 2 },
      { id: 'vie_pro-l5-3', label: 'Aurore', alt: 'Aurore', order: 3 },
      { id: 'vie_pro-l5-4', label: 'Constellation', alt: 'Constellation', order: 4 },
      { id: 'vie_pro-l5-5', label: "Rune de l'Influence III", alt: "Rune de l'Influence III", order: 5, family: 'rune' },
    ],
  },
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/category-elements-config.ts
git commit -m "feat: add provisional per-category progression element config"
```

---

### Task 4: Derived element functions

**Files:**
- Modify: `lib/category-elements.ts`
- Modify: `lib/category-elements.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `lib/category-elements.test.ts`:

```ts

import {
  getCategoryLevelElements,
  getUnlockedElements,
  getLockedElements,
  getNextElement,
  getPointsRemainingToElement,
  getPointsRemainingToNextLevel,
} from './category-elements';

// self_care niveau 3 : 3 éléments (Herbes fraîches, Foyer de pierres, Rune de l'Antre I),
// coût réel du niveau 3 (SCORING_CONFIG_FALLBACK) = 85 → seuils [22, 43, 64].
describe('éléments dérivés — self_care niveau 3, coût 85', () => {
  it('getCategoryLevelElements renvoie les 3 éléments dans l\'ordre', () => {
    const elements = getCategoryLevelElements('self_care', 3);
    expect(elements.map(e => e.label)).toEqual([
      'Herbes fraîches',
      'Foyer de pierres',
      "Rune de l'Antre I",
    ]);
  });

  it('0 point : aucun élément acquis', () => {
    expect(getUnlockedElements('self_care', 3, 0, 85)).toEqual([]);
    expect(getNextElement('self_care', 3, 0, 85)?.label).toBe('Herbes fraîches');
    expect(getPointsRemainingToElement('self_care', 3, 0, 85)).toBe(22);
  });

  it('juste avant le premier seuil (21)', () => {
    expect(getUnlockedElements('self_care', 3, 21, 85)).toEqual([]);
    expect(getPointsRemainingToElement('self_care', 3, 21, 85)).toBe(1);
  });

  it('seuil exact (22) : premier élément acquis', () => {
    const unlocked = getUnlockedElements('self_care', 3, 22, 85);
    expect(unlocked.map(e => e.label)).toEqual(['Herbes fraîches']);
    expect(getNextElement('self_care', 3, 22, 85)?.label).toBe('Foyer de pierres');
    expect(getPointsRemainingToElement('self_care', 3, 22, 85)).toBe(21);
  });

  it('juste après le premier seuil (23)', () => {
    expect(getUnlockedElements('self_care', 3, 23, 85).map(e => e.label)).toEqual(['Herbes fraîches']);
    expect(getPointsRemainingToElement('self_care', 3, 23, 85)).toBe(20);
  });

  it('dernier élément obtenu (64) : plus de prochain élément mais niveau pas encore atteint', () => {
    expect(getUnlockedElements('self_care', 3, 64, 85).map(e => e.label)).toEqual([
      'Herbes fraîches', 'Foyer de pierres', "Rune de l'Antre I",
    ]);
    expect(getLockedElements('self_care', 3, 64, 85)).toEqual([]);
    expect(getNextElement('self_care', 3, 64, 85)).toBeNull();
    expect(getPointsRemainingToElement('self_care', 3, 64, 85)).toBeNull();
    expect(getPointsRemainingToNextLevel(3, 64, 85)).toBe(21);
  });

  it('niveau atteint (85) : segment de niveau à 0', () => {
    expect(getPointsRemainingToNextLevel(3, 85, 85)).toBe(0);
  });
});

describe('niveau maximal (5) — pointsInLevel peut dépasser le coût sans plafond côté moteur', () => {
  it('tous les éléments sont acquis et aucun manque de points n\'est affiché', () => {
    // self_care niveau 5 : 5 éléments, coût réel 140.
    expect(getUnlockedElements('self_care', 5, 200, 140)).toHaveLength(5);
    expect(getLockedElements('self_care', 5, 200, 140)).toEqual([]);
    expect(getNextElement('self_care', 5, 200, 140)).toBeNull();
    expect(getPointsRemainingToNextLevel(5, 200, 140)).toBe(0);
  });
});

describe('configuration incomplète / catégorie ou niveau inconnu', () => {
  it('niveau hors bornes (0 ou 6) renvoie une liste vide sans lever d\'exception', () => {
    expect(getCategoryLevelElements('self_care', 0)).toEqual([]);
    expect(getCategoryLevelElements('self_care', 6)).toEqual([]);
    expect(getUnlockedElements('self_care', 6, 50, 85)).toEqual([]);
    expect(getNextElement('self_care', 6, 50, 85)).toBeNull();
  });
});

describe('utilisateur existant avec plusieurs niveaux déjà terminés', () => {
  it('vie_pro déjà au niveau 4 avec 60 points dans le niveau (coût 110) retrouve directement ses éléments', () => {
    // vie_pro niveau 4 : Monolithe, Cristal, Halo, Rune de l'Influence II — seuils pour C=110,N=4 : [22,44,66,88]
    const unlocked = getUnlockedElements('vie_pro', 4, 60, 110);
    expect(unlocked.map(e => e.label)).toEqual(['Monolithe', 'Cristal']);
    expect(getNextElement('vie_pro', 4, 60, 110)?.label).toBe('Halo');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest lib/category-elements.test.ts`
Expected: FAIL — the newly imported functions don't exist yet.

- [ ] **Step 3: Implement**

Append to `lib/category-elements.ts`:

```ts

import { CATEGORY_ELEMENTS_CONFIG } from './category-elements-config';
import type { CategoryType, ProgressionElement } from './types';

export function getCategoryLevelElements(category: CategoryType, level: number): ProgressionElement[] {
  return CATEGORY_ELEMENTS_CONFIG[category]?.[level] ?? [];
}

export function getUnlockedElements(
  category: CategoryType,
  level: number,
  pointsInLevel: number,
  pointsToNextLevel: number
): ProgressionElement[] {
  const elements = getCategoryLevelElements(category, level);
  const clamped = getPointsWithinCurrentLevel(pointsInLevel, pointsToNextLevel);
  const thresholds = getElementThresholds(pointsToNextLevel, elements.length);
  return elements.filter((_, i) => clamped >= thresholds[i]);
}

export function getLockedElements(
  category: CategoryType,
  level: number,
  pointsInLevel: number,
  pointsToNextLevel: number
): ProgressionElement[] {
  const elements = getCategoryLevelElements(category, level);
  const unlockedIds = new Set(getUnlockedElements(category, level, pointsInLevel, pointsToNextLevel).map(e => e.id));
  return elements.filter(e => !unlockedIds.has(e.id));
}

export function getNextElement(
  category: CategoryType,
  level: number,
  pointsInLevel: number,
  pointsToNextLevel: number
): ProgressionElement | null {
  const locked = getLockedElements(category, level, pointsInLevel, pointsToNextLevel);
  return locked[0] ?? null;
}

export function getPointsRemainingToElement(
  category: CategoryType,
  level: number,
  pointsInLevel: number,
  pointsToNextLevel: number
): number | null {
  const elements = getCategoryLevelElements(category, level);
  const next = getNextElement(category, level, pointsInLevel, pointsToNextLevel);
  if (!next) return null;
  const index = elements.findIndex(e => e.id === next.id);
  const thresholds = getElementThresholds(pointsToNextLevel, elements.length);
  const clamped = getPointsWithinCurrentLevel(pointsInLevel, pointsToNextLevel);
  return Math.max(0, thresholds[index] - clamped);
}

export function getPointsRemainingToNextLevel(
  level: number,
  pointsInLevel: number,
  pointsToNextLevel: number
): number {
  if (level >= 5) return 0;
  const clamped = getPointsWithinCurrentLevel(pointsInLevel, pointsToNextLevel);
  return Math.max(0, pointsToNextLevel - clamped);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest lib/category-elements.test.ts`
Expected: PASS (all tests, ~25 total)

- [ ] **Step 5: Commit**

```bash
git add lib/category-elements.ts lib/category-elements.test.ts
git commit -m "feat: derive unlocked/locked/next progression elements from category points"
```

---

### Task 5: `ProgressionElementIcon` component

**Files:**
- Create: `components/profile-redesign/ProgressionElementIcon.tsx`
- Test: `components/profile-redesign/ProgressionElementIcon.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/profile-redesign/ProgressionElementIcon.test.tsx`:

```tsx
// components/profile-redesign/ProgressionElementIcon.test.tsx
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Image } from 'react-native';
import { ProgressionElementIcon } from './ProgressionElementIcon';
import type { ProgressionElement } from '@/lib/types';

const baseElement: ProgressionElement = {
  id: 'self_care-l2-1',
  label: 'Herbes coupées',
  alt: 'Herbes coupées',
  order: 1,
};

describe('ProgressionElementIcon', () => {
  it('affiche un placeholder textuel accessible quand assetPath est absent', () => {
    const renderer = TestRenderer.create(
      <ProgressionElementIcon element={baseElement} state="unlocked" accentColor="#2e7d32" mutedColor="#ccc" />
    );
    const images = renderer.root.findAllByType(Image);
    expect(images).toHaveLength(0);
    const labelled = renderer.root.findAllByProps({ accessibilityLabel: 'Herbes coupées' });
    expect(labelled.length).toBeGreaterThan(0);
  });

  it('affiche une image quand assetPath est renseigné', () => {
    const withAsset = { ...baseElement, assetPath: 'https://example.com/herbes.png' };
    const renderer = TestRenderer.create(
      <ProgressionElementIcon element={withAsset} state="unlocked" accentColor="#2e7d32" mutedColor="#ccc" />
    );
    const images = renderer.root.findAllByType(Image);
    expect(images).toHaveLength(1);
    expect(images[0].props.accessibilityLabel).toBe('Herbes coupées');
  });

  it('un élément verrouillé reste rendu (estompé) et garde son accessibilityLabel', () => {
    const renderer = TestRenderer.create(
      <ProgressionElementIcon element={baseElement} state="locked" accentColor="#2e7d32" mutedColor="#ccc" />
    );
    const labelled = renderer.root.findAllByProps({ accessibilityLabel: 'Herbes coupées' });
    expect(labelled.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest components/profile-redesign/ProgressionElementIcon.test.tsx`
Expected: FAIL — `Cannot find module './ProgressionElementIcon'`

- [ ] **Step 3: Implement**

Create `components/profile-redesign/ProgressionElementIcon.tsx`:

```tsx
// components/profile-redesign/ProgressionElementIcon.tsx
import { ThemedText } from '@/components/themed-text';
import { getReadableTextColor } from '@/lib/theme-evolution';
import type { ProgressionElement } from '@/lib/types';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface ProgressionElementIconProps {
  element: ProgressionElement;
  state: 'unlocked' | 'locked';
  accentColor: string;
  mutedColor: string;
  size?: number;
}

export function ProgressionElementIcon({
  element,
  state,
  accentColor,
  mutedColor,
  size = 32,
}: ProgressionElementIconProps) {
  const isLocked = state === 'locked';
  const opacity = isLocked ? 0.35 : 1;

  if (element.assetPath) {
    return (
      <Image
        source={{ uri: element.assetPath }}
        accessibilityLabel={element.alt}
        style={[styles.image, { width: size, height: size, opacity }]}
      />
    );
  }

  const backgroundColor = isLocked ? mutedColor : accentColor;
  const initials = element.label.slice(0, 2).toUpperCase();

  return (
    <View
      accessible
      accessibilityLabel={element.alt}
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2, backgroundColor, opacity },
      ]}
    >
      <ThemedText style={[styles.placeholderText, { fontSize: size * 0.34, color: getReadableTextColor(backgroundColor) }]}>
        {initials}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { borderRadius: 8 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontWeight: '800' },
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest components/profile-redesign/ProgressionElementIcon.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/profile-redesign/ProgressionElementIcon.tsx components/profile-redesign/ProgressionElementIcon.test.tsx
git commit -m "feat: add ProgressionElementIcon with textual placeholder fallback"
```

---

### Task 6: `SanctuaryCategoryCard` component (replaces `HabitCard` on this page)

**Files:**
- Create: `components/profile-redesign/SanctuaryCategoryCard.tsx`
- Test: `components/profile-redesign/SanctuaryCategoryCard.test.tsx`
- Reference: `components/profile-redesign/HabitCard.tsx` (to be deleted in Task 7), `lib/scoring-fallback.ts` (`SCORING_CONFIG_FALLBACK`)

- [ ] **Step 1: Write the failing test**

Create `components/profile-redesign/SanctuaryCategoryCard.test.tsx`:

```tsx
// components/profile-redesign/SanctuaryCategoryCard.test.tsx
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { ThemedText } from '@/components/themed-text';
import { SCORING_CONFIG_FALLBACK } from '@/lib/scoring-fallback';
import type { CategoryProgress } from '@/lib/types';
import { SanctuaryCategoryCard } from './SanctuaryCategoryCard';

function progress(current_level: number, points_in_level: number): CategoryProgress {
  return {
    user_id: 'u1',
    category: 'self_care',
    current_level,
    points_in_level,
    last_maintenance_date: null,
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

function allText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAllByType(ThemedText)
    .map(n => (Array.isArray(n.props.children) ? n.props.children.join('') : n.props.children))
    .join(' | ');
}

describe('SanctuaryCategoryCard', () => {
  it('niveau 3 avec 23 points : affiche le niveau, les points, le prochain élément et les points manquants', () => {
    const renderer = TestRenderer.create(
      <SanctuaryCategoryCard
        category="self_care"
        categoryProgress={progress(3, 23)}
        scoringConfigs={SCORING_CONFIG_FALLBACK}
      />
    );
    const text = allText(renderer);
    expect(text).toContain('Niv. 3/5');
    expect(text).toContain('23 / 85');
    expect(text).toContain('Foyer de pierres');
    expect(text).toContain('20 points');
  });

  it('niveau max (5) : pas de bloc "prochain élément" ni "niveau suivant", barre à 100%', () => {
    const renderer = TestRenderer.create(
      <SanctuaryCategoryCard
        category="self_care"
        categoryProgress={progress(5, 200)}
        scoringConfigs={SCORING_CONFIG_FALLBACK}
      />
    );
    const text = allText(renderer);
    expect(text).not.toContain('Prochain');
    expect(text).not.toContain('Niveau suivant');
    expect(text).toContain('140 / 140');
  });

  it('affiche les éléments verrouillés du niveau courant en plus des acquis', () => {
    const renderer = TestRenderer.create(
      <SanctuaryCategoryCard
        category="self_care"
        categoryProgress={progress(4, 0)}
        scoringConfigs={SCORING_CONFIG_FALLBACK}
      />
    );
    const labelled = renderer.root.findAllByProps({ accessibilityLabel: "Rune de l'Antre II" });
    expect(labelled.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest components/profile-redesign/SanctuaryCategoryCard.test.tsx`
Expected: FAIL — `Cannot find module './SanctuaryCategoryCard'`

- [ ] **Step 3: Implement**

Create `components/profile-redesign/SanctuaryCategoryCard.tsx`:

```tsx
// components/profile-redesign/SanctuaryCategoryCard.tsx
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ACCESSORY_LABELS } from '@/lib/accessoires';
import {
  getLockedElements,
  getNextElement,
  getPointsRemainingToElement,
  getPointsRemainingToNextLevel,
  getPointsWithinCurrentLevel,
  getUnlockedElements,
} from '@/lib/category-elements';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getScoringConfigForLevel } from '@/lib/scoring-config';
import { ensureContrast, getReadableTextColor } from '@/lib/theme-evolution';
import type { CategoryProgress, CategoryType, ScoringConfig } from '@/lib/types';
import { getAccessoryName } from '@/lib/wolf-data';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressionElementIcon } from './ProgressionElementIcon';

interface SanctuaryCategoryCardProps {
  category: CategoryType;
  categoryProgress: CategoryProgress;
  scoringConfigs: ScoringConfig[];
}

export function SanctuaryCategoryCard({ category, categoryProgress, scoringConfigs }: SanctuaryCategoryCardProps) {
  const theme = useWolfLevelTheme();
  const { current_level: level, points_in_level: pointsInLevel } = categoryProgress;

  const accentColor = ensureContrast(CATEGORY_COLORS[category].mid, theme.surface, 4.5);
  const config = getScoringConfigForLevel(scoringConfigs, level);
  const pointsToNextLevel = config.points_to_next_level;
  const isMaxLevel = level >= 5;

  const levelName = getAccessoryName(category, level);
  const nextLevelName = isMaxLevel ? null : getAccessoryName(category, level + 1);
  const pointsWithinLevel = getPointsWithinCurrentLevel(pointsInLevel, pointsToNextLevel);
  const progressRatio = pointsToNextLevel > 0 ? Math.min(1, pointsWithinLevel / pointsToNextLevel) : 1;

  const unlocked = getUnlockedElements(category, level, pointsInLevel, pointsToNextLevel);
  const locked = getLockedElements(category, level, pointsInLevel, pointsToNextLevel);
  const orderedElements = [...unlocked, ...locked].sort((a, b) => a.order - b.order);
  const unlockedIds = new Set(unlocked.map(e => e.id));

  const nextElement = getNextElement(category, level, pointsInLevel, pointsToNextLevel);
  const pointsToNextElement = getPointsRemainingToElement(category, level, pointsInLevel, pointsToNextLevel);
  const pointsToLevelUp = getPointsRemainingToNextLevel(level, pointsInLevel, pointsToNextLevel);

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceRaised, borderColor: accentColor }]}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.categoryLabel, { color: accentColor }]}>
          {ACCESSORY_LABELS[category].toUpperCase()}
        </ThemedText>
        <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
          <ThemedText style={[styles.levelBadgeText, { color: getReadableTextColor(accentColor) }]}>
            Niv. {level}/5
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.cardName, { color: theme.text }]} numberOfLines={2}>
        {levelName}
      </ThemedText>

      <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
        <View style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%`, backgroundColor: accentColor }]} />
      </View>
      <ThemedText style={[styles.progressValue, { color: theme.textMuted }]}>
        {Math.round(pointsWithinLevel)} / {pointsToNextLevel}
      </ThemedText>

      <View style={styles.elementsRow}>
        {orderedElements.map(element => (
          <ProgressionElementIcon
            key={element.id}
            element={element}
            state={unlockedIds.has(element.id) ? 'unlocked' : 'locked'}
            accentColor={accentColor}
            mutedColor={theme.borderSoft}
          />
        ))}
      </View>

      {nextElement && pointsToNextElement !== null && (
        <ThemedText style={[styles.hintText, { color: theme.textMuted }]}>
          Prochain : {nextElement.label} dans {pointsToNextElement} points
        </ThemedText>
      )}

      {!isMaxLevel && (
        <ThemedText style={[styles.hintText, { color: theme.textMuted }]}>
          Niveau suivant ({nextLevelName}) dans {pointsToLevelUp} points
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '47%', flexGrow: 1, minHeight: 220, borderRadius: 14, borderWidth: 2, padding: 14, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  levelBadgeText: { fontSize: 11, fontWeight: '800' },
  cardName: { fontSize: 14, fontWeight: '700', lineHeight: 18, minHeight: 36 },
  progressTrack: { height: 7, borderRadius: 3.5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3.5 },
  progressValue: { fontSize: 10, fontWeight: '600' },
  elementsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  hintText: { fontSize: 10, fontWeight: '600', lineHeight: 14 },
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest components/profile-redesign/SanctuaryCategoryCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/profile-redesign/SanctuaryCategoryCard.tsx components/profile-redesign/SanctuaryCategoryCard.test.tsx
git commit -m "feat: add SanctuaryCategoryCard rendering unlocked/locked progression elements"
```

---

### Task 7: Wire into the page, rename tab, remove the old card

**Files:**
- Modify: `components/profile-redesign/index.ts`
- Modify: `app/(tabs)/profile.tsx`
- Modify: `app/(tabs)/_layout.tsx:30`
- Delete: `components/profile-redesign/HabitCard.tsx`

- [ ] **Step 1: Update the barrel export**

Replace the content of `components/profile-redesign/index.ts`:

```ts
export { ProfileHeader } from './ProfileHeader';
export { SanctuaryCategoryCard } from './SanctuaryCategoryCard';
export { GamificationExplainer } from './GamificationExplainer';
```

- [ ] **Step 2: Update `profile.tsx` import and usage**

In `app/(tabs)/profile.tsx`, change the import on line 2:

```ts
import { ProfileHeader, SanctuaryCategoryCard, GamificationExplainer } from '@/components/profile-redesign';
```

Change the header title on line 107 from `Profil` to `Sanctuaire`:

```tsx
<ThemedText style={[styles.headerTitle, { color: theme.text }]}>Sanctuaire</ThemedText>
```

Replace the `<HabitCard ... />` usage (lines 133-138) with:

```tsx
              <SanctuaryCategoryCard
                key={category}
                category={category}
                categoryProgress={progress[category]}
                scoringConfigs={scoringConfigs}
              />
```

(Note: the `key={category}` stays on the rendered element itself, same as before — only the component name changes.)

- [ ] **Step 3: Rename the tab bar label**

In `app/(tabs)/_layout.tsx`, change line 30:

```ts
          title: 'Sanctuaire',
```

- [ ] **Step 4: Delete the superseded component**

```bash
git rm components/profile-redesign/HabitCard.tsx
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (confirms nothing else imports the deleted `HabitCard.tsx` from `components/profile-redesign` — `components/habit-card.tsx`, used by `category-section.tsx`, is a different, unrelated file and is untouched).

- [ ] **Step 6: Commit**

```bash
git add components/profile-redesign/index.ts "app/(tabs)/profile.tsx" "app/(tabs)/_layout.tsx"
git commit -m "feat: rename Profil page to Sanctuaire and wire in SanctuaryCategoryCard"
```

---

### Task 8: Full verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all existing suites (`lib/avatar-level.test.ts`, `lib/wolf-data.test.ts`, `lib/scoring-config.test.ts`, `lib/scoring.test.ts`, `lib/theme-evolution.test.ts`, `lib/auth.test.ts`, etc.) still pass unchanged, plus the new suites from Tasks 2, 4, 5, 6.

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors introduced by the changed/created files.

- [ ] **Step 4: Manual QA note**

This is an Expo/React Native app — there is no headless browser to screenshot. Before considering this done end-to-end, start the app (`npx expo start`, then open on a simulator/device or `w` for web) and visually confirm on the Sanctuaire page:
- Bottom tab reads "Sanctuaire".
- Page header reads "Sanctuaire".
- Each of the 4 category cards shows level, points, locked/unlocked element chips, "Prochain : ..." and "Niveau suivant ... " text.
- A category at level 5 shows no "Prochain"/"Niveau suivant" text and a full progress bar.
- The wolf tier-change `CelebrationModal` still triggers normally (unrelated to this change, but confirm no regression).

- [ ] **Step 5: Report**

Summarize: files added/modified/deleted, test results, the fact that no Supabase migration was needed (derived computation), and that Playwright tests were not added because this is a React Native/Expo app (noted as a spec divergence, not silently skipped).
