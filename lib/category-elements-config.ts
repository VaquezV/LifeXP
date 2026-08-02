// lib/category-elements-config.ts
// Libellés provisoires (assets réels pas encore générés — voir assets/icones_accessoires/).
// Modifier cette configuration ne doit jamais nécessiter de toucher lib/category-elements.ts
// ni les composants d'affichage.
import type { CategoryType, ProgressionElement } from './types';

type LevelElementsMap = Record<number, ProgressionElement[]>;

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
      { id: 'dev_perso-l4-3', label: 'Souffle puissant', alt: 'Souffle puissant', order: 3 },
      { id: 'dev_perso-l4-4', label: 'Rune du Souffle II', alt: 'Rune du Souffle II', order: 4, family: 'rune' },
    ],
    5: [
      { id: 'dev_perso-l5-1', label: 'Moustaches ancestrales', alt: 'Moustaches ancestrales', order: 1 },
      { id: 'dev_perso-l5-2', label: 'Crocs sacrés', alt: 'Crocs sacrés', order: 2 },
      { id: 'dev_perso-l5-3', label: 'Souffle sacré', alt: 'Souffle sacré', order: 3 },
      { id: 'dev_perso-l5-4', label: 'Voix du Gardien', alt: 'Voix du Gardien', order: 4 },
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
      { id: 'vie_familiale-l3-3', label: 'Rune du Lien I', alt: 'Rune du Lien I', order: 3, family: 'rune' },
    ],
    4: [
      { id: 'vie_familiale-l4-1', label: 'Protection', alt: 'Protection', order: 1 },
      { id: 'vie_familiale-l4-2', label: 'Hurlement de meute', alt: 'Hurlement de meute', order: 2 },
      { id: 'vie_familiale-l4-3', label: 'Feu commun', alt: 'Feu commun', order: 3 },
      { id: 'vie_familiale-l4-4', label: 'Rune du Lien II', alt: 'Rune du Lien II', order: 4, family: 'rune' },
    ],
    5: [
      { id: 'vie_familiale-l5-1', label: 'Transmission', alt: 'Transmission', order: 1 },
      { id: 'vie_familiale-l5-2', label: 'Chant de meute', alt: 'Chant de meute', order: 2 },
      { id: 'vie_familiale-l5-3', label: 'Refuge collectif', alt: 'Refuge collectif', order: 3 },
      { id: 'vie_familiale-l5-4', label: 'Cercle de la meute', alt: 'Cercle de la meute', order: 4 },
      { id: 'vie_familiale-l5-5', label: 'Rune du Lien III', alt: 'Rune du Lien III', order: 5, family: 'rune' },
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
      { id: 'vie_pro-l5-4', label: 'Constellation', alt: 'Constellation', order: 4 },
      { id: 'vie_pro-l5-5', label: "Rune de l'Influence III", alt: "Rune de l'Influence III", order: 5, family: 'rune' },
    ],
  },
};
