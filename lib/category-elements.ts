// lib/category-elements.ts

/** Spreads elementCount milestones across N+1 equal segments of a level's point cost, so the last one stays below the level-up threshold. Called by derived element functions (Task 4) and SanctuaryCategoryCard. Assumes costToNextLevel is comfortably larger than elementCount — true for all real scoring_config levels (50–140 pts vs 1–5 elements), not guaranteed for arbitrary inputs. */
export function getElementThresholds(costToNextLevel: number, elementCount: number): number[] {
  if (elementCount <= 0) return [];
  const segments = elementCount + 1;
  return Array.from({ length: elementCount }, (_, i) =>
    Math.ceil(((i + 1) * costToNextLevel) / segments)
  );
}

/** Clamps points_in_level to the level's cost for display, since a maxed-out category (level 5) keeps accumulating points past its cost with no level 6 to roll into. Called by the progression card to avoid showing more than 100% progress. */
export function getPointsWithinCurrentLevel(pointsInLevel: number, pointsToNextLevel: number): number {
  return Math.min(pointsInLevel, pointsToNextLevel);
}
