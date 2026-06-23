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

export function getAccessoryTierIndex(pct: number): 0 | 1 | 2 | 3 | 4 {
  if (pct <= 20) return 0;
  if (pct <= 40) return 1;
  if (pct <= 60) return 2;
  if (pct <= 80) return 3;
  return 4;
}

export function getAccessoryTierLabel(pct: number): string {
  return `Palier ${getAccessoryTierIndex(pct) + 1} / 5`;
}

export function getAccessoryFileName(category: CategoryType, pct: number): string {
  const type = ACCESSORY_TYPE[category];
  const tiers = ['0-20', '21-40', '41-60', '61-80', '81-100'] as const;
  return `${type}.${tiers[getAccessoryTierIndex(pct)]}.svg`;
}

// Representative pct values, one per tier, used to build filenames by tier index.
const TIER_MIDPOINTS = [10, 30, 50, 70, 90] as const;

export function getNextTierFileName(category: CategoryType, score: number): string {
  const nextTier = Math.min(getAccessoryTierIndex(score) + 1, 4);
  return getAccessoryFileName(category, TIER_MIDPOINTS[nextTier]);
}

const WOLF_QUOTES: Array<{ minPct: number; quote: string }> = [
  { minPct: 0, quote: 'Même le loup le plus faible peut apprendre à chasser.' },
  { minPct: 20, quote: 'Chaque pas trace le chemin. Continue.' },
  { minPct: 40, quote: 'La meute ne s\'arrête pas quand les pattes font mal.' },
  { minPct: 60, quote: 'Tu es dans ta zone. Le loup ne recule pas.' },
  { minPct: 80, quote: 'La forêt tremble quand le loup hurle à pleine puissance.' },
];

export function getWolfQuote(weeklyPct: number): string {
  let quote = WOLF_QUOTES[0].quote;
  for (const entry of WOLF_QUOTES) {
    if (weeklyPct >= entry.minPct) quote = entry.quote;
  }
  return quote;
}
