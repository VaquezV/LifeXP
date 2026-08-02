// lib/category-elements.test.ts
import { getElementThresholds, getPointsWithinCurrentLevel } from './category-elements';

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
