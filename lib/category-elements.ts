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

import { CATEGORY_ELEMENTS_CONFIG } from './category-elements-config';
import type { CategoryType, ProgressionElement } from './types';

/** Looks up the ordered milestone elements configured for a category/level pair, sorting by `.order` so threshold-to-element mapping never depends on the config array's manual ordering. Returns an empty list for unknown categories or out-of-range levels (0 or 6+) rather than throwing, since level bounds are enforced by the scoring engine, not this lookup. Called by all derived element functions below and by SanctuaryCategoryCard. */
export function getCategoryLevelElements(category: CategoryType, level: number): ProgressionElement[] {
  const elements = CATEGORY_ELEMENTS_CONFIG[category]?.[level] ?? [];
  return [...elements].sort((a, b) => a.order - b.order);
}

/** Derives which of a level's elements are already earned, given the user's current points_in_level and the level's points_to_next_level cost. Called by SanctuaryCategoryCard to render acquired vs locked milestones with zero persistence — recomputed from category_progress on every render. */
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

/** Complement of getUnlockedElements for the same level: the milestones not yet reached. Called by SanctuaryCategoryCard to grey out or hide not-yet-earned elements. */
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

/** Returns the next locked element to unlock in the current level, or null if either the category is at max level or the current level's elements are all already unlocked (the "last segment" state — level not yet reached despite all milestones earned). Called by SanctuaryCategoryCard alongside getPointsRemainingToNextLevel to disambiguate those two null cases. */
export function getNextElement(
  category: CategoryType,
  level: number,
  pointsInLevel: number,
  pointsToNextLevel: number
): ProgressionElement | null {
  const locked = getLockedElements(category, level, pointsInLevel, pointsToNextLevel);
  return locked[0] ?? null;
}

/** Computes how many points remain before getNextElement unlocks, or null when there is no next element. Called by SanctuaryCategoryCard to show a "X points to go" hint under the next milestone. */
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

/** Computes how many points remain before the category levels up entirely, returning 0 once level 5 (max) is reached since there is no level 6 to progress into. Called by SanctuaryCategoryCard, alongside getNextElement, to decide whether to show the "niveau suivant" block at all. */
export function getPointsRemainingToNextLevel(
  level: number,
  pointsInLevel: number,
  pointsToNextLevel: number
): number {
  if (level >= 5) return 0;
  const clamped = getPointsWithinCurrentLevel(pointsInLevel, pointsToNextLevel);
  return Math.max(0, pointsToNextLevel - clamped);
}
