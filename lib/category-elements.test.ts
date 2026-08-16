// lib/category-elements.test.ts
import {
  getElementThresholds,
  getPointsWithinCurrentLevel,
  getCategoryLevelElements,
  getUnlockedElements,
  getLockedElements,
  getNextElement,
  getPointsRemainingToElement,
  getPointsRemainingToNextLevel,
  getHeldElements,
} from './category-elements';

describe('getElementThresholds', () => {
  it('1 élément', () => {
    expect(getElementThresholds(50, 1)).toEqual([25]);
  });

  it('2 éléments, coût divisible (75)', () => {
    expect(getElementThresholds(75, 2)).toEqual([25, 50]);
  });

  it('3 éléments, coût non divisible (50)', () => {
    expect(getElementThresholds(50, 3)).toEqual([13, 25, 38]);
  });

  it('4 éléments, coût divisible (100)', () => {
    expect(getElementThresholds(100, 4)).toEqual([20, 40, 60, 80]);
  });

  it('5 éléments (coût réel niveau 5 = 140)', () => {
    expect(getElementThresholds(140, 5)).toEqual([24, 47, 70, 94, 117]);
  });

  it('0 point de coût → tous les seuils valent 0', () => {
    expect(getElementThresholds(0, 3)).toEqual([0, 0, 0]);
  });

  it('0 élément → liste vide', () => {
    expect(getElementThresholds(85, 0)).toEqual([]);
  });

  it('la séquence est strictement croissante pour un coût non nul', () => {
    const thresholds = getElementThresholds(85, 3);
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }
  });

  it('le dernier seuil est strictement inférieur au coût total', () => {
    for (const [cost, count] of [[75, 2], [100, 4], [50, 3], [140, 5], [85, 1]] as const) {
      const thresholds = getElementThresholds(cost, count);
      expect(thresholds[thresholds.length - 1]).toBeLessThan(cost);
    }
  });
});

describe('getPointsWithinCurrentLevel', () => {
  it('retourne pointsInLevel tel quel sous le coût du niveau', () => {
    expect(getPointsWithinCurrentLevel(40, 85)).toBe(40);
  });

  it('plafonne au coût du niveau si pointsInLevel le dépasse (niveau max qui continue à accumuler)', () => {
    expect(getPointsWithinCurrentLevel(200, 140)).toBe(140);
  });

  it('seuil exact reste inchangé', () => {
    expect(getPointsWithinCurrentLevel(85, 85)).toBe(85);
  });

  it('zéro point', () => {
    expect(getPointsWithinCurrentLevel(0, 85)).toBe(0);
  });
});

// self_care niveau 3 : 3 éléments (Herbes fraîches, Foyer de pierres, Rune de l'Antre I),
// coût réel du niveau 3 (SCORING_CONFIG_FALLBACK) = 85 → seuils [22, 43, 64].
describe('éléments dérivés — self_care niveau 3, coût 85', () => {
  it('getCategoryLevelElements renvoie les 3 éléments dans l\'ordre', () => {
    const elements = getCategoryLevelElements('self_care', 3);
    expect(elements.map(e => e.label)).toEqual([
      'Herbes fraîches',
      'Foyer de pierres',
      "Rune de l'Antre I",
    ]);
  });

  it('0 point : aucun élément acquis', () => {
    expect(getUnlockedElements('self_care', 3, 0, 85)).toEqual([]);
    expect(getNextElement('self_care', 3, 0, 85)?.label).toBe('Herbes fraîches');
    expect(getPointsRemainingToElement('self_care', 3, 0, 85)).toBe(22);
  });

  it('juste avant le premier seuil (21)', () => {
    expect(getUnlockedElements('self_care', 3, 21, 85)).toEqual([]);
    expect(getPointsRemainingToElement('self_care', 3, 21, 85)).toBe(1);
  });

  it('seuil exact (22) : premier élément acquis', () => {
    const unlocked = getUnlockedElements('self_care', 3, 22, 85);
    expect(unlocked.map(e => e.label)).toEqual(['Herbes fraîches']);
    expect(getNextElement('self_care', 3, 22, 85)?.label).toBe('Foyer de pierres');
    expect(getPointsRemainingToElement('self_care', 3, 22, 85)).toBe(21);
  });

  it('juste après le premier seuil (23)', () => {
    expect(getUnlockedElements('self_care', 3, 23, 85).map(e => e.label)).toEqual(['Herbes fraîches']);
    expect(getPointsRemainingToElement('self_care', 3, 23, 85)).toBe(20);
  });

  it('dernier élément obtenu (64) : plus de prochain élément mais niveau pas encore atteint', () => {
    expect(getUnlockedElements('self_care', 3, 64, 85).map(e => e.label)).toEqual([
      'Herbes fraîches', 'Foyer de pierres', "Rune de l'Antre I",
    ]);
    expect(getLockedElements('self_care', 3, 64, 85)).toEqual([]);
    expect(getNextElement('self_care', 3, 64, 85)).toBeNull();
    expect(getPointsRemainingToElement('self_care', 3, 64, 85)).toBeNull();
    expect(getPointsRemainingToNextLevel(3, 64, 85)).toBe(21);
  });

  it('niveau atteint (85) : segment de niveau à 0', () => {
    expect(getPointsRemainingToNextLevel(3, 85, 85)).toBe(0);
  });
});

describe('niveau maximal (5) — pointsInLevel peut dépasser le coût sans plafond côté moteur', () => {
  it('tous les éléments sont acquis et aucun manque de points n\'est affiché', () => {
    // self_care niveau 5 : 5 éléments, coût réel 140.
    expect(getUnlockedElements('self_care', 5, 200, 140)).toHaveLength(5);
    expect(getLockedElements('self_care', 5, 200, 140)).toEqual([]);
    expect(getNextElement('self_care', 5, 200, 140)).toBeNull();
    expect(getPointsRemainingToNextLevel(5, 200, 140)).toBe(0);
  });
});

describe('configuration incomplète / catégorie ou niveau inconnu', () => {
  it('niveau hors bornes (0 ou 6) renvoie une liste vide sans lever d\'exception', () => {
    expect(getCategoryLevelElements('self_care', 0)).toEqual([]);
    expect(getCategoryLevelElements('self_care', 6)).toEqual([]);
    expect(getUnlockedElements('self_care', 6, 50, 85)).toEqual([]);
    expect(getNextElement('self_care', 6, 50, 85)).toBeNull();
  });
});

describe('utilisateur existant avec plusieurs niveaux déjà terminés', () => {
  it('vie_pro déjà au niveau 4 avec 60 points dans le niveau (coût 110) retrouve directement ses éléments', () => {
    // vie_pro niveau 4 : Monolithe, Cristal, Halo, Rune de l'Influence II — seuils pour C=110,N=4 : [22,44,66,88]
    const unlocked = getUnlockedElements('vie_pro', 4, 60, 110);
    expect(unlocked.map(e => e.label)).toEqual(['Monolithe', 'Cristal']);
    expect(getNextElement('vie_pro', 4, 60, 110)?.label).toBe('Halo');
  });
});

// getHeldElements = la collection cumulée que l'utilisateur possède : tous les
// éléments des niveaux déjà entièrement franchis (1..currentLevel), plus ceux
// déjà débloqués dans le niveau en cours de progression (currentLevel + 1).
// self_care niveau 1 : 1 élément (Paille sèche), coût 50 → seuil [25].
// self_care niveau 2 : 2 éléments (Herbes coupées, Petit foyer), coût 65 → seuils [22, 44].
describe('getHeldElements', () => {
  it('niveau 0, à moins de la moitié des points vers le niveau 1 : rien de tenu', () => {
    expect(getHeldElements('self_care', 0, 20, 50)).toEqual([]);
  });

  it('niveau 0, à la moitié des points vers le niveau 1 : l\'accessoire du niveau 1 est acquis', () => {
    const held = getHeldElements('self_care', 0, 25, 50);
    expect(held.map(e => e.label)).toEqual(['Paille sèche']);
  });

  it('niveau 1 juste après la montée : l\'accessoire du niveau 1 reste acquis, rien du niveau 2 encore', () => {
    const held = getHeldElements('self_care', 1, 0, 65);
    expect(held.map(e => e.label)).toEqual(['Paille sèche']);
  });

  it('niveau 1 avec des points dans le niveau : cumule le niveau 1 entier + le premier élément du niveau 2', () => {
    const held = getHeldElements('self_care', 1, 22, 65);
    expect(held.map(e => e.label)).toEqual(['Paille sèche', 'Herbes coupées']);
  });

  it('niveau 5 (max) : tous les éléments de tous les niveaux, rien en cours', () => {
    const held = getHeldElements('self_care', 5, 999, 0);
    const allLabels = [1, 2, 3, 4, 5].flatMap(l => getCategoryLevelElements('self_care', l).map(e => e.label));
    expect(held.map(e => e.label)).toEqual(allLabels);
  });

  it('une légère décroissance qui reste au-dessus du seuil ne fait rien perdre', () => {
    // décroissance niveau 1 -> niveau 0, 75% du coût niveau 1 (50) = 38 >= seuil 25
    const held = getHeldElements('self_care', 0, 38, 50);
    expect(held.map(e => e.label)).toEqual(['Paille sèche']);
  });

  it('une décroissance suffisante fait perdre l\'accessoire', () => {
    const held = getHeldElements('self_care', 0, 10, 50);
    expect(held).toEqual([]);
  });
});
