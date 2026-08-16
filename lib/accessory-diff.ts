import { getHeldElements } from './category-elements';
import type { CategoryType, ProgressionElement, ScoringConfig } from './types';

export interface CategorySnapshot {
  category: CategoryType;
  level: number;
  pointsInLevel: number;
}

export interface AccessoryDiffItem {
  category: CategoryType;
  element: ProgressionElement;
}

export interface AccessoryDiff {
  gained: AccessoryDiffItem[];
  lost: AccessoryDiffItem[];
}

function pointsToNextLevelFor(configs: ScoringConfig[], level: number): number {
  return configs.find(c => c.level === level + 1)?.points_to_next_level ?? 0;
}

/** Diffs two category_progress snapshots (typically last-seen vs current) into the accessories gained/lost across all categories, using getHeldElements as the source of truth for "what the user holds" at each point. Called by app/_layout.tsx to decide whether to show the accessory gain/loss modals. */
export function computeAccessoryDiff(
  before: CategorySnapshot[],
  after: CategorySnapshot[],
  configs: ScoringConfig[]
): AccessoryDiff {
  const gained: AccessoryDiffItem[] = [];
  const lost: AccessoryDiffItem[] = [];

  for (const afterSnap of after) {
    const beforeSnap = before.find(b => b.category === afterSnap.category);
    if (!beforeSnap) continue;

    const heldBefore = getHeldElements(
      beforeSnap.category, beforeSnap.level, beforeSnap.pointsInLevel, pointsToNextLevelFor(configs, beforeSnap.level)
    );
    const heldAfter = getHeldElements(
      afterSnap.category, afterSnap.level, afterSnap.pointsInLevel, pointsToNextLevelFor(configs, afterSnap.level)
    );

    const beforeIds = new Set(heldBefore.map(e => e.id));
    const afterIds = new Set(heldAfter.map(e => e.id));

    for (const el of heldAfter) if (!beforeIds.has(el.id)) gained.push({ category: afterSnap.category, element: el });
    for (const el of heldBefore) if (!afterIds.has(el.id)) lost.push({ category: afterSnap.category, element: el });
  }

  return { gained, lost };
}
