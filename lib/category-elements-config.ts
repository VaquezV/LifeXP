// lib/category-elements-config.ts
/**
 * Catalogue unique des accessoires du Sanctuaire.
 *
 * C'est le seul fichier à modifier pour les dénominations affichées et les
 * SVG associés. Les composants affichent automatiquement le SVG correspondant
 * ou leur fallback lorsque `ACCESSORY_ICON_FILES_BY_LABEL` ne contient pas le
 * libellé. Les associations sont rangées par familles pour être faciles à lire.
 */
import type { CategoryType, ProgressionElement } from './types';

type LevelElementsMap = Record<number, ProgressionElement[]>;

export const ACCESSORY_LABELS: Record<CategoryType, string> = {
  self_care: 'Antre',
  dev_perso: 'Cri',
  vie_familiale: 'Meute',
  vie_pro: 'Totem',
};

export const CATEGORY_CURRENCY_NAMES: Record<CategoryType, string> = {
  self_care: 'Fourrure',
  dev_perso: 'Souffle',
  vie_familiale: 'Interaction',
  vie_pro: 'Influence',
};

const ACCESSORY_NAMES: Record<CategoryType, readonly string[]> = {
  self_care: ['Tanière des Cendres', 'Antre des Racines', 'Refuge des Forêts', 'Sanctuaire des Profondeurs', 'Caverne des Cristaux'],
  dev_perso: ['Souffle Muet', 'Grondement des Plaines', 'Rugissement Doré', 'Hurlement des Vagues', 'Chant des Origines'],
  vie_familiale: ['Loup Solitaire', 'Duo des Lisières', 'Meute des Clairières', 'Meute des Territoires', 'Légion des Ombres'],
  vie_pro: ['Pierre Brute', 'Stèle Gravée', 'Totem Éveillé', 'Totem Ardent', 'Totem Divin'],
};

export function getAccessoryName(category: CategoryType, level: number): string {
  const names = ACCESSORY_NAMES[category];
  return names[Math.min(Math.max(level - 1, 0), names.length - 1)];
}

const ACCESSORY_TYPE: Record<CategoryType, string> = {
  self_care: 'antre',
  dev_perso: 'cri',
  vie_familiale: 'meute',
  vie_pro: 'totem',
};

const ACCESSORY_TIERS = ['0-20', '21-40', '41-60', '61-80', '81-100'] as const;

export function getAccessoryTierFromLevel(level: number): 0 | 1 | 2 | 3 | 4 {
  // A category visual is earned at level 1: N1 -> 0-20, …, N5 -> 81-100.
  return Math.min(Math.max(level - 1, 0), 4) as 0 | 1 | 2 | 3 | 4;
}

export function getAccessoryFileName(category: CategoryType, level: number): string {
  return `${ACCESSORY_TYPE[category]}.${ACCESSORY_TIERS[getAccessoryTierFromLevel(level)]}.svg`;
}

const CATEGORY_AVATAR_ASSETS = {
  'antre.0-20.svg': require('@/assets/accessoires/antre.0-20.svg'),
  'antre.21-40.svg': require('@/assets/accessoires/antre.21-40.svg'),
  'antre.41-60.svg': require('@/assets/accessoires/antre.41-60.svg'),
  'antre.61-80.svg': require('@/assets/accessoires/antre.61-80.svg'),
  'antre.81-100.svg': require('@/assets/accessoires/antre.81-100.svg'),
  'cri.0-20.svg': require('@/assets/accessoires/cri.0-20.svg'),
  'cri.21-40.svg': require('@/assets/accessoires/cri.21-40.svg'),
  'cri.41-60.svg': require('@/assets/accessoires/cri.41-60.svg'),
  'cri.61-80.svg': require('@/assets/accessoires/cri.61-80.svg'),
  'cri.81-100.svg': require('@/assets/accessoires/cri.81-100.svg'),
  'meute.0-20.svg': require('@/assets/accessoires/meute.0-20.svg'),
  'meute.21-40.svg': require('@/assets/accessoires/meute.21-40.svg'),
  'meute.41-60.svg': require('@/assets/accessoires/meute.41-60.svg'),
  'meute.61-80.svg': require('@/assets/accessoires/meute.61-80.svg'),
  'meute.81-100.svg': require('@/assets/accessoires/meute.81-100.svg'),
  'totem.0-20.svg': require('@/assets/accessoires/totem.0-20.svg'),
  'totem.21-40.svg': require('@/assets/accessoires/totem.21-40.svg'),
  'totem.41-60.svg': require('@/assets/accessoires/totem.41-60.svg'),
  'totem.61-80.svg': require('@/assets/accessoires/totem.61-80.svg'),
  'totem.81-100.svg': require('@/assets/accessoires/totem.81-100.svg'),
} as const;

export function getCategoryAvatarAsset(category: CategoryType, level: number): number | undefined {
  // Before level 1, there is no category avatar yet: only accessories can be earned.
  if (level <= 0) return undefined;
  const fileName = getAccessoryFileName(category, level);
  return CATEGORY_AVATAR_ASSETS[fileName as keyof typeof CATEGORY_AVATAR_ASSETS];
}

const PROGRESSION_ICON_ASSETS = {
  'couche-1.svg': require('@/assets/icones_accessoires/couche-1.svg'),
  'couche-2.svg': require('@/assets/icones_accessoires/couche-2.svg'),
  'couche-3.svg': require('@/assets/icones_accessoires/couche-3.svg'),
  'couche-4.svg': require('@/assets/icones_accessoires/couche-4.svg'),
  'couche-5.svg': require('@/assets/icones_accessoires/couche-5.svg'),
  'feu-2.svg': require('@/assets/icones_accessoires/feu-2.svg'),
  'feu-3.svg': require('@/assets/icones_accessoires/feu-3.svg'),
  'feu-4.svg': require('@/assets/icones_accessoires/feu-4.svg'),
  'feu-5.svg': require('@/assets/icones_accessoires/feu-5.svg'),
  'source-4.svg': require('@/assets/icones_accessoires/source-4.svg'),
  'source-5.svg': require('@/assets/icones_accessoires/source-5.svg'),
  'rune_antre-3.svg': require('@/assets/icones_accessoires/rune_antre-3.svg'),
  'rune_antre-4.svg': require('@/assets/icones_accessoires/rune_antre-4.svg'),
  'rune_antre-5.svg': require('@/assets/icones_accessoires/rune_antre-5.svg'),
  'moustache-1.svg': require('@/assets/icones_accessoires/moustache-1.svg'),
  'moustache-2.svg': require('@/assets/icones_accessoires/moustache-2.svg'),
  'moustache-3.svg': require('@/assets/icones_accessoires/moustache-3.svg'),
  'moustache-4.svg': require('@/assets/icones_accessoires/moustache-4.svg'),
  'moustache-5.svg': require('@/assets/icones_accessoires/moustache-5.svg'),
  'crocs-2.svg': require('@/assets/icones_accessoires/crocs-2.svg'),
  'crocs-3.svg': require('@/assets/icones_accessoires/crocs-3.svg'),
  'crocs-4.svg': require('@/assets/icones_accessoires/crocs-4.svg'),
  'crocs-5.svg': require('@/assets/icones_accessoires/crocs-5.svg'),
  'rune_cri-3.svg': require('@/assets/icones_accessoires/rune_cri-3.svg'),
  'rune_cri-4.svg': require('@/assets/icones_accessoires/rune_cri-4.svg'),
  'rune_cri-5.svg': require('@/assets/icones_accessoires/rune_cri-5.svg'),
  'cri_ancien-5.svg': require('@/assets/icones_accessoires/cri_ancien-5.svg'),
  'souffle-4.svg': require('@/assets/icones_accessoires/souffle-4.svg'),
  'souffle-5.svg': require('@/assets/icones_accessoires/souffle-5.svg'),
  'rune_meute-3.svg': require('@/assets/icones_accessoires/rune_meute-3.svg'),
  'rune_meute-4.svg': require('@/assets/icones_accessoires/rune_meute-4.svg'),
  'rune_meute-5.svg': require('@/assets/icones_accessoires/rune_meute-5.svg'),
  'partage-4.svg': require('@/assets/icones_accessoires/partage-4.svg'),
  'partage-5.svg': require('@/assets/icones_accessoires/partage-5.svg'),
  'transmission-5.svg': require('@/assets/icones_accessoires/transmission-5.svg'),
  'pierre-1.svg': require('@/assets/icones_accessoires/pierre-1.svg'),
  'pierre-2.svg': require('@/assets/icones_accessoires/pierre-2.svg'),
  'pierre-3.svg': require('@/assets/icones_accessoires/pierre-3.svg'),
  'pierre-4.svg': require('@/assets/icones_accessoires/pierre-4.svg'),
  'pierre-5.svg': require('@/assets/icones_accessoires/pierre-5.svg'),
  'etoile-2.svg': require('@/assets/icones_accessoires/etoile-2.svg'),
  'etoile-3.svg': require('@/assets/icones_accessoires/etoile-3.svg'),
  'etoile-4.svg': require('@/assets/icones_accessoires/etoile-4.svg'),
  'etoile-5.svg': require('@/assets/icones_accessoires/etoile-5.svg'),
  'cristal-4.svg': require('@/assets/icones_accessoires/cristal-4.svg'),
  'cristal-5.svg': require('@/assets/icones_accessoires/cristal-5.svg'),
  'empreinte-5.svg': require('@/assets/icones_accessoires/empreinte-5.svg'),
  'rune_territoire-3.svg': require('@/assets/icones_accessoires/rune_territoire-3.svg'),
  'rune_territoire-4.svg': require('@/assets/icones_accessoires/rune_territoire-4.svg'),
  'rune_territoire-5.svg': require('@/assets/icones_accessoires/rune_territoire-5.svg'),
} as const;

/** Libellé lu dans l'interface → fichier SVG. Une absence conserve le fallback. */
export const ACCESSORY_ICON_FILES_BY_LABEL: Partial<Record<string, keyof typeof PROGRESSION_ICON_ASSETS>> = {
  // Antre · Couches
  'Paille sèche': 'couche-1.svg', 'Herbes coupées': 'couche-2.svg', 'Herbes fraîches': 'couche-3.svg', Mousse: 'couche-4.svg', 'Plumes douces': 'couche-5.svg',
  // Antre · Feux, sources et runes
  'Petit foyer': 'feu-2.svg', 'Foyer de pierres': 'feu-3.svg', Brasero: 'feu-4.svg', 'Flamme sacrée': 'feu-5.svg', Source: 'source-4.svg', Cascade: 'source-5.svg',
  "Rune de l'Antre I": 'rune_antre-3.svg', "Rune de l'Antre II": 'rune_antre-4.svg', "Rune de l'Antre III": 'rune_antre-5.svg',
  // Cri · Moustaches
  'Moustaches naissantes': 'moustache-1.svg', 'Moustaches allongées': 'moustache-2.svg', 'Moustaches épaisses': 'moustache-3.svg', 'Moustaches nobles': 'moustache-4.svg', 'Moustaches ancestrales': 'moustache-5.svg',
  // Cri · Crocs, feux du souffle et runes
  'Premiers crocs': 'crocs-2.svg', 'Crocs développés': 'crocs-3.svg', 'Crocs aiguisés': 'crocs-4.svg', 'Crocs sacrés': 'crocs-5.svg',
  'Souffle maîtrisé': 'souffle-4.svg', 'Souffle ancestral': 'souffle-5.svg', 'Voix de l’Ancien': 'cri_ancien-5.svg',
  'Rune du Souffle I': 'rune_cri-3.svg', 'Rune du Souffle II': 'rune_cri-4.svg', 'Rune du Souffle III': 'rune_cri-5.svg',
  // Meute · réserves, transmission et runes du lien
  'Réserve partagée': 'partage-4.svg', 'Réserve prospère': 'partage-5.svg', 'Relève de la Meute': 'transmission-5.svg',
  'Rune de Lien inférieur': 'rune_meute-3.svg', 'Rune de Lien intermédiaire': 'rune_meute-4.svg', 'Rune de Lien supérieur': 'rune_meute-5.svg',
  // Totem · pierres principales
  Galet: 'pierre-1.svg', 'Pierre polie': 'pierre-2.svg', Menhir: 'pierre-3.svg', Monolithe: 'pierre-4.svg', 'Stèle sacrée': 'pierre-5.svg',
  Étincelle: 'etoile-2.svg', Lueur: 'etoile-3.svg', Halo: 'etoile-4.svg', Aurore: 'etoile-5.svg',
  Cristal: 'cristal-4.svg', 'Cristal ancien': 'cristal-5.svg', 'Empreinte de l’Ancien': 'empreinte-5.svg',
  "Rune de l'Influence I": 'rune_territoire-3.svg', "Rune de l'Influence II": 'rune_territoire-4.svg', "Rune de l'Influence III": 'rune_territoire-5.svg',
};

function resolveProgressionIcon(element: ProgressionElement): ProgressionElement {
  const assetFileName = ACCESSORY_ICON_FILES_BY_LABEL[element.label];
  if (!assetFileName) return element;
  return { ...element, assetFileName, assetSource: PROGRESSION_ICON_ASSETS[assetFileName] };
}

export const CATEGORY_ELEMENTS_CONFIG: Record<CategoryType, LevelElementsMap> = {
  self_care: {
    1: [
      { id: 'self_care-l1-1', label: 'Paille sèche', alt: 'Paille sèche', order: 1 },
    ],
    2: [
      { id: 'self_care-l2-1', label: 'Herbes coupées', alt: 'Herbes coupées', order: 1 },
      { id: 'self_care-l2-2', label: 'Petit foyer', alt: 'Petit foyer', order: 2 },
    ],
    3: [
      { id: 'self_care-l3-1', label: 'Herbes fraîches', alt: 'Herbes fraîches', order: 1 },
      { id: 'self_care-l3-2', label: 'Foyer de pierres', alt: 'Foyer de pierres', order: 2 },
      { id: 'self_care-l3-3', label: "Rune de l'Antre I", alt: "Rune de l'Antre I", order: 3, family: 'rune' },
    ],
    4: [
      { id: 'self_care-l4-1', label: 'Mousse', alt: 'Mousse', order: 1 },
      { id: 'self_care-l4-2', label: 'Brasero', alt: 'Brasero', order: 2 },
      { id: 'self_care-l4-3', label: 'Source', alt: 'Source', order: 3 },
      { id: 'self_care-l4-4', label: "Rune de l'Antre II", alt: "Rune de l'Antre II", order: 4, family: 'rune' },
    ],
    5: [
      { id: 'self_care-l5-1', label: 'Plumes douces', alt: 'Plumes douces', order: 1 },
      { id: 'self_care-l5-2', label: 'Flamme sacrée', alt: 'Flamme sacrée', order: 2 },
      { id: 'self_care-l5-3', label: 'Cascade', alt: 'Cascade', order: 3 },
      { id: 'self_care-l5-4', label: 'Arbre ancien', alt: 'Arbre ancien', order: 4 },
      { id: 'self_care-l5-5', label: "Rune de l'Antre III", alt: "Rune de l'Antre III", order: 5, family: 'rune' },
    ],
  },
  dev_perso: {
    1: [
      { id: 'dev_perso-l1-1', label: 'Moustaches naissantes', alt: 'Moustaches naissantes', order: 1 },
    ],
    2: [
      { id: 'dev_perso-l2-1', label: 'Moustaches allongées', alt: 'Moustaches allongées', order: 1 },
      { id: 'dev_perso-l2-2', label: 'Premiers crocs', alt: 'Premiers crocs', order: 2 },
    ],
    3: [
      { id: 'dev_perso-l3-1', label: 'Moustaches épaisses', alt: 'Moustaches épaisses', order: 1 },
      { id: 'dev_perso-l3-2', label: 'Crocs développés', alt: 'Crocs développés', order: 2 },
      { id: 'dev_perso-l3-3', label: 'Rune du Souffle I', alt: 'Rune du Souffle I', order: 3, family: 'rune' },
    ],
    4: [
      { id: 'dev_perso-l4-1', label: 'Moustaches nobles', alt: 'Moustaches nobles', order: 1 },
      { id: 'dev_perso-l4-2', label: 'Crocs aiguisés', alt: 'Crocs aiguisés', order: 2 },
      { id: 'dev_perso-l4-3', label: 'Souffle maîtrisé', alt: 'Souffle maîtrisé', order: 3 },
      { id: 'dev_perso-l4-4', label: 'Rune du Souffle II', alt: 'Rune du Souffle II', order: 4, family: 'rune' },
    ],
    5: [
      { id: 'dev_perso-l5-1', label: 'Moustaches ancestrales', alt: 'Moustaches ancestrales', order: 1 },
      { id: 'dev_perso-l5-2', label: 'Crocs sacrés', alt: 'Crocs sacrés', order: 2 },
      { id: 'dev_perso-l5-3', label: 'Souffle ancestral', alt: 'Souffle ancestral', order: 3 },
      { id: 'dev_perso-l5-4', label: 'Voix de l’Ancien', alt: 'Voix de l’Ancien', order: 4 },
      { id: 'dev_perso-l5-5', label: 'Rune du Souffle III', alt: 'Rune du Souffle III', order: 5, family: 'rune' },
    ],
  },
  vie_familiale: {
    1: [
      { id: 'vie_familiale-l1-1', label: 'Regard bienveillant', alt: 'Regard bienveillant', order: 1 },
    ],
    2: [
      { id: 'vie_familiale-l2-1', label: 'Regard complice', alt: 'Regard complice', order: 1 },
      { id: 'vie_familiale-l2-2', label: 'Queue expressive', alt: 'Queue expressive', order: 2 },
    ],
    3: [
      { id: 'vie_familiale-l3-1', label: 'Toilettage', alt: 'Toilettage', order: 1 },
      { id: 'vie_familiale-l3-2', label: 'Premier hurlement', alt: 'Premier hurlement', order: 2 },
      { id: 'vie_familiale-l3-3', label: 'Rune de Lien inférieur', alt: 'Rune de Lien inférieur', order: 3, family: 'rune' },
    ],
    4: [
      { id: 'vie_familiale-l4-1', label: 'Protection', alt: 'Protection', order: 1 },
      { id: 'vie_familiale-l4-2', label: 'Hurlement de meute', alt: 'Hurlement de meute', order: 2 },
      { id: 'vie_familiale-l4-3', label: 'Réserve partagée', alt: 'Réserve partagée', order: 3 },
      { id: 'vie_familiale-l4-4', label: 'Rune de Lien intermédiaire', alt: 'Rune de Lien intermédiaire', order: 4, family: 'rune' },
    ],
    5: [
      { id: 'vie_familiale-l5-1', label: 'Relève de la Meute', alt: 'Relève de la Meute', order: 1 },
      { id: 'vie_familiale-l5-2', label: 'Chant de meute', alt: 'Chant de meute', order: 2 },
      { id: 'vie_familiale-l5-3', label: 'Réserve prospère', alt: 'Réserve prospère', order: 3 },
      { id: 'vie_familiale-l5-4', label: 'Cercle de la meute', alt: 'Cercle de la meute', order: 4 },
      { id: 'vie_familiale-l5-5', label: 'Rune de Lien supérieur', alt: 'Rune de Lien supérieur', order: 5, family: 'rune' },
    ],
  },
  vie_pro: {
    1: [
      { id: 'vie_pro-l1-1', label: 'Galet', alt: 'Galet', order: 1 },
    ],
    2: [
      { id: 'vie_pro-l2-1', label: 'Pierre polie', alt: 'Pierre polie', order: 1 },
      { id: 'vie_pro-l2-2', label: 'Étincelle', alt: 'Étincelle', order: 2 },
    ],
    3: [
      { id: 'vie_pro-l3-1', label: 'Menhir', alt: 'Menhir', order: 1 },
      { id: 'vie_pro-l3-2', label: 'Lueur', alt: 'Lueur', order: 2 },
      { id: 'vie_pro-l3-3', label: "Rune de l'Influence I", alt: "Rune de l'Influence I", order: 3, family: 'rune' },
    ],
    4: [
      { id: 'vie_pro-l4-1', label: 'Monolithe', alt: 'Monolithe', order: 1 },
      { id: 'vie_pro-l4-2', label: 'Cristal', alt: 'Cristal', order: 2 },
      { id: 'vie_pro-l4-3', label: 'Halo', alt: 'Halo', order: 3 },
      { id: 'vie_pro-l4-4', label: "Rune de l'Influence II", alt: "Rune de l'Influence II", order: 4, family: 'rune' },
    ],
    5: [
      { id: 'vie_pro-l5-1', label: 'Stèle sacrée', alt: 'Stèle sacrée', order: 1 },
      { id: 'vie_pro-l5-2', label: 'Cristal ancien', alt: 'Cristal ancien', order: 2 },
      { id: 'vie_pro-l5-3', label: 'Aurore', alt: 'Aurore', order: 3 },
      { id: 'vie_pro-l5-4', label: 'Empreinte de l’Ancien', alt: 'Empreinte de l’Ancien', order: 4 },
      { id: 'vie_pro-l5-5', label: "Rune de l'Influence III", alt: "Rune de l'Influence III", order: 5, family: 'rune' },
    ],
  },
};

// Enrichit les éléments avec leur SVG local quand le catalogue en fournit un.
// Les éléments non listés ci-dessus conservent leur placeholder accessible.
for (const levels of Object.values(CATEGORY_ELEMENTS_CONFIG)) {
  for (const elements of Object.values(levels)) {
    elements.forEach((element, index) => {
      elements[index] = resolveProgressionIcon(element);
    });
  }
}
