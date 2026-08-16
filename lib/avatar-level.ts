// lib/avatar-level.ts
import { CategoryType } from './types';

export type CategoryLevels = Record<CategoryType, number>;

function countAtLeast(levels: CategoryLevels, minLevel: number): number {
  return Object.values(levels).filter(l => l >= minLevel).length;
}

export function validateCategoryLevelProgression(currentLevel: number, targetLevel: number): boolean {
  // Level progression must be linear: can only increase by 1
  return targetLevel <= currentLevel + 1;
}

export function getAvatarScoreFromLevels(levels: CategoryLevels): number {
  const lvl1 = countAtLeast(levels, 1);
  const lvl2 = countAtLeast(levels, 2);
  const lvl3 = countAtLeast(levels, 3);
  const lvl4 = countAtLeast(levels, 4);
  const lvl5 = countAtLeast(levels, 5);

  // Each pair of global forms is earned by two, then four categories at the
  // same category level. Avatar 10 remains the completion reward: all N5.
  if (lvl5 >= 4) return 95;
  if (lvl4 >= 4) return 85;
  if (lvl4 >= 2 && lvl3 >= 4) return 75;
  if (lvl3 >= 4) return 65;
  if (lvl3 >= 2 && lvl2 >= 4) return 55;
  if (lvl2 >= 4) return 45;
  if (lvl2 >= 2 && lvl1 >= 4) return 35;
  if (lvl1 >= 4) return 25;
  if (lvl1 >= 2) return 15;
  return 5;
}
