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
