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
  const lvl5 = countAtLeast(levels, 5);
  const lvl4 = countAtLeast(levels, 4);
  const lvl3 = countAtLeast(levels, 3);
  const lvl2 = countAtLeast(levels, 2);

  // Level 10
  if (lvl5 >= 4) return 95;

  // level 9
  if (lvl5 >= 2 && lvl4 >= 4) return 85;

  // Level 8
  if (lvl4 >= 4) return 75;

  //  level 7
  if (lvl4 >= 2 && lvl3 >= 4) return 65;

  // Level 6 foundation
  if (lvl3 >= 4) return 55;

  // lelve 5
  if (lvl3 >= 2 && lvl2 >= 4) return 45;

  // Level 4
  if (lvl2 >= 4) return 35;

  // level 3
  if (lvl2 >= 2) return 25;

  // level 2
  if (lvl2 >= 1) return 15;

  return 5;
}
