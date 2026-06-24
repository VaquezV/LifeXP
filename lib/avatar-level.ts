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
