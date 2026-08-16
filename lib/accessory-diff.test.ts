import { computeAccessoryDiff, CategorySnapshot } from './accessory-diff';
import { SCORING_CONFIG_FALLBACK } from './scoring-fallback';

function snap(category: CategorySnapshot['category'], level: number, pointsInLevel: number): CategorySnapshot {
  return { category, level, pointsInLevel };
}

describe('computeAccessoryDiff', () => {
  it('no change → empty diff', () => {
    const before = [snap('self_care', 1, 22)];
    const after = [snap('self_care', 1, 22)];
    expect(computeAccessoryDiff(before, after, SCORING_CONFIG_FALLBACK)).toEqual({ gained: [], lost: [] });
  });

  it('crossing a threshold within the in-progress bucket gains an element', () => {
    // self_care level 1 -> level 2 bucket, threshold pour le 1er élément = 22 (coût 65)
    const before = [snap('self_care', 1, 20)];
    const after = [snap('self_care', 1, 22)];
    const diff = computeAccessoryDiff(before, after, SCORING_CONFIG_FALLBACK);
    expect(diff.gained).toEqual([{ category: 'self_care', element: expect.objectContaining({ label: 'Herbes coupées' }) }]);
    expect(diff.lost).toEqual([]);
  });

  it('levelling up keeps the previous level accessory (no false loss)', () => {
    const before = [snap('self_care', 0, 25)]; // niveau 1 acquis (seuil 25/50)
    const after = [snap('self_care', 1, 0)]; // vient de monter, remise à 0 dans le niveau 2
    const diff = computeAccessoryDiff(before, after, SCORING_CONFIG_FALLBACK);
    expect(diff.gained).toEqual([]);
    expect(diff.lost).toEqual([]);
  });

  it('decaying below a threshold loses the element', () => {
    const before = [snap('self_care', 1, 22)]; // "Herbes coupées" acquis
    const after = [snap('self_care', 0, 10)]; // décroissance jusqu'à niveau 0, sous le seuil niveau1 (25)
    const diff = computeAccessoryDiff(before, after, SCORING_CONFIG_FALLBACK);
    expect(diff.gained).toEqual([]);
    expect(diff.lost.map(item => item.element.label).sort()).toEqual(['Herbes coupées', 'Paille sèche']);
  });

  it('a single level-down that stays above the lower threshold loses nothing', () => {
    const before = [snap('self_care', 1, 0)]; // niveau 1 acquis, rien encore dans le niveau 2
    const after = [snap('self_care', 0, 38)]; // décroissance: 75% du coût niveau1 (50) = 38, >= seuil 25
    const diff = computeAccessoryDiff(before, after, SCORING_CONFIG_FALLBACK);
    expect(diff.gained).toEqual([]);
    expect(diff.lost).toEqual([]);
  });

  it('groups gains and losses across multiple categories', () => {
    const before = [snap('self_care', 1, 20), snap('vie_pro', 1, 22)];
    const after = [snap('self_care', 1, 22), snap('vie_pro', 0, 10)];
    const diff = computeAccessoryDiff(before, after, SCORING_CONFIG_FALLBACK);
    expect(diff.gained.map(item => item.category)).toEqual(['self_care']);
    expect(diff.lost.map(item => item.category).sort()).toEqual(['vie_pro', 'vie_pro']);
  });

  it('ignores categories missing from the before snapshot', () => {
    const before: CategorySnapshot[] = [];
    const after = [snap('self_care', 1, 22)];
    expect(computeAccessoryDiff(before, after, SCORING_CONFIG_FALLBACK)).toEqual({ gained: [], lost: [] });
  });
});
