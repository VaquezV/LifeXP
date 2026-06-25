import { getAvatarScoreFromLevels, type CategoryLevels } from './avatar-level';
import { SCORING_CONFIG_FALLBACK } from './scoring-config';
import type { CategoryProgress, CategoryType, ScoringConfig } from './types';
import { CATEGORY_KEYS } from './types';

const SCORE_THRESHOLDS = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95] as const;

const WOLF_CLASSES = [
  'Louveteau des Cendres',
  'Éveil des Frimas',
  'Rôdeur des Lisières',
  'Traqueur des Herbes',
  'Chasseur des Brumes',
  'Gardien des Clairières',
  'Seigneur des Territoires',
  'Loup-Totem',
  'Esprit de la Meute',
  'Loup Dieu des Origines',
] as const;

const WOLF_MANTRAS: readonly string[][] = [
  ['Chaque jour est un premier pas.', 'Le feu commence par une étincelle.', "Dormir, c'est déjà survivre."],
  ["J'ouvre les yeux sur ce que je peux devenir.", 'Le froid réveille.', 'Je sens le monde pour la première fois.'],
  ["Je n'appartiens pas encore à la forêt, mais je l'approche.", 'Chaque lisière franchie est une victoire.', "Je rôde, donc j'existe."],
  ["Je suis patient. La proie vient à qui sait attendre.", 'Mes pattes connaissent le chemin.', "Je trace ma route dans l'herbe haute."],
  ["La brume ne me cache plus, elle me protège.", 'Je chasse ce qui me rend plus fort.', "L'effort d'aujourd'hui nourrit demain."],
  ['Je protège ce qui compte.', "La clairière est à moi parce que je l'ai méritée.", "Garder, c'est aussi grandir."],
  ['Mon territoire est le reflet de ma discipline.', "Je n'occupe pas l'espace, je le mérite.", "Chaque habitude est une frontière que j'étends."],
  ['Je suis devenu ce que je pratique.', "Ma légende s'écrit chaque matin.", 'Les autres voient le résultat. Je connais le chemin.'],
  ['Je ne cours plus pour moi seul.', "Mon énergie rayonne sur ceux qui m'entourent.", "L'esprit ne vieillit pas. Il s'affine."],
  ["Je suis l'origine et l'aboutissement.", "Rien ne commence sans effort. Rien ne s'arrête sans raison.", 'Je suis la preuve que c\'est possible.'],
];

const ACCESSORY_NAMES: Record<CategoryType, readonly string[]> = {
  self_care:     ['Tanière des Cendres', 'Antre des Racines', 'Refuge des Forêts', 'Sanctuaire des Profondeurs', 'Caverne des Cristaux'],
  dev_perso:     ['Souffle Muet', 'Grondement des Plaines', 'Rugissement Doré', 'Hurlement des Vagues', 'Chant des Origines'],
  vie_familiale: ['Loup Solitaire', 'Duo des Lisières', 'Meute des Clairières', 'Meute des Territoires', 'Légion des Ombres'],
  vie_pro:       ['Pierre Brute', 'Stèle Gravée', 'Totem Éveillé', 'Totem Ardent', 'Totem Divin'],
};

const NEXT_LEVEL_CATS: Array<{ key: CategoryType; label: string }> = [
  { key: 'self_care',     label: 'Antre' },
  { key: 'dev_perso',     label: 'Cri' },
  { key: 'vie_familiale', label: 'Meute' },
  { key: 'vie_pro',       label: 'Totem' },
];

export function getWolfTierIndex(score: number): number {
  const idx = SCORE_THRESHOLDS.findIndex(t => score <= t);
  return idx >= 0 ? idx : SCORE_THRESHOLDS.length - 1;
}

export function getWolfClass(score: number): string {
  return WOLF_CLASSES[getWolfTierIndex(score)];
}

export function getNextClass(score: number): string | null {
  const idx = getWolfTierIndex(score);
  return idx < WOLF_CLASSES.length - 1 ? WOLF_CLASSES[idx + 1] : null;
}

export function getStarString(score: number): string {
  const filled = getWolfTierIndex(score) + 1;
  return '★'.repeat(filled) + '☆'.repeat(10 - filled);
}

export function getRandomMantra(tierIndex: number): string {
  const quotes = WOLF_MANTRAS[Math.min(tierIndex, WOLF_MANTRAS.length - 1)];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getAccessoryName(category: CategoryType, level: number): string {
  const names = ACCESSORY_NAMES[category];
  return names[Math.min(Math.max(level - 1, 0), names.length - 1)];
}

export function computeTotalXP(
  progress: Record<CategoryType, CategoryProgress>,
  scoringConfigs: ScoringConfig[]
): number {
  return CATEGORY_KEYS.reduce((total, cat) => {
    const { current_level, points_in_level } = progress[cat];
    let past = 0;
    for (let l = 1; l < current_level; l++) {
      const cfg = scoringConfigs.find(c => c.level === l) ?? SCORING_CONFIG_FALLBACK[0];
      past += cfg.points_to_next_level;
    }
    return total + past + points_in_level;
  }, 0);
}

export function getNextLevelText(levels: CategoryLevels): string {
  const score = getAvatarScoreFromLevels(levels);
  if (score >= 95) return '—';

  const below = (minLevel: number) => NEXT_LEVEL_CATS.filter(c => levels[c.key] < minLevel);
  const fmt = (cats: typeof NEXT_LEVEL_CATS, niv: number) =>
    cats.map(c => `${c.label} niv${niv}`).join(', ');

  if (score <= 5)  return fmt(below(2).slice(0, 1), 2);
  if (score <= 15) return fmt(below(2).slice(0, 1), 2);
  if (score <= 25) return fmt(below(2), 2);
  if (score <= 35) return fmt(below(3).slice(0, 2), 3);
  if (score <= 45) return fmt(below(3), 3);
  if (score <= 55) return fmt(below(4).slice(0, 2), 4);
  if (score <= 65) return fmt(below(4), 4);
  if (score <= 75) return fmt(below(5).slice(0, 2), 5);
  return fmt(below(5), 5);
}
