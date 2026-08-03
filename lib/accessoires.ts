// lib/accessoires.ts
import { ACCESSORY_LABELS, getAccessoryFileName } from './category-elements-config';
import type { CategoryType } from './types';

// Compatibility exports: all accessory names and local assets now live in the catalog.
export {
  ACCESSORY_LABELS,
  CATEGORY_CURRENCY_NAMES,
  getAccessoryFileName,
  getAccessoryTierFromLevel,
} from './category-elements-config';

const CATEGORY_PROJECTION_COPY: Record<CategoryType, { name: string; gainWord: string; maintenanceWord: string }> = {
  self_care: { name: ACCESSORY_LABELS.self_care, gainWord: 'ton ancrage', maintenanceWord: 'mue' },
  dev_perso: { name: ACCESSORY_LABELS.dev_perso, gainWord: 'ta discipline', maintenanceWord: 'respiration' },
  vie_familiale: { name: ACCESSORY_LABELS.vie_familiale, gainWord: 'ta présence', maintenanceWord: 'partage' },
  vie_pro: { name: 'Pro', gainWord: 'ta rigueur', maintenanceWord: 'patrouille' },
};

/** "Antre : +X pour ton ancrage · -Y mue" — X is today's projected scoring gain, Y the category's daily maintenance cost. */
export function formatProjectionLine(category: CategoryType, projectedGain: number, maintenanceCost: number): string {
  const { name, gainWord, maintenanceWord } = CATEGORY_PROJECTION_COPY[category];
  const gain = Math.round(projectedGain);
  const maintenance = Number.isInteger(maintenanceCost) ? maintenanceCost.toString() : maintenanceCost.toFixed(1);
  return `${name} : +${gain} pour ${gainWord} | -${maintenance} ${maintenanceWord}`;
}

const VOWELS = /^[aeiouàâäéèêëîïôùûüœæy]/i;

export function formatPoints(points: number, currencyName: string): string {
  const n = Math.floor(points);
  const unit = n <= 1 ? 'point' : 'points';
  const prep = VOWELS.test(currencyName) ? "d'" : 'de ';
  return `${n} ${unit} ${prep}${currencyName}`;
}

export function getAccessoryTierLabel(level: number): string {
  return `Palier ${level}/5`;
}

export function getNextTierFileName(category: CategoryType, level: number): string {
  const nextLevel = Math.min(level + 1, 5);
  return getAccessoryFileName(category, nextLevel);
}


const WOLF_QUOTES: Array<{ minScore: number; quote: string }> = [
  { minScore: 0, quote: 'Même le loup le plus faible peut apprendre à chasser.' },
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
