// lib/avatar-level.test.ts
import { getAvatarScoreFromLevels } from './avatar-level';
import { CategoryType } from './types';

function levels(sc: number, dp: number, vf: number, vp: number): Record<CategoryType, number> {
  return { self_care: sc, dev_perso: dp, vie_familiale: vf, vie_pro: vp };
}

describe('getAvatarScoreFromLevels', () => {
  it('toutes N1 → 5', () => {
    expect(getAvatarScoreFromLevels(levels(1, 1, 1, 1))).toBe(5);
  });

  it('1 catégorie N2 → 15', () => {
    expect(getAvatarScoreFromLevels(levels(2, 1, 1, 1))).toBe(15);
  });

  it('2 catégories N2 → 25', () => {
    expect(getAvatarScoreFromLevels(levels(2, 2, 1, 1))).toBe(25);
  });

  it('toutes N2 → 35', () => {
    expect(getAvatarScoreFromLevels(levels(2, 2, 2, 2))).toBe(35);
  });

  it('2 N2 + 2 N3 → 45', () => {
    expect(getAvatarScoreFromLevels(levels(3, 3, 2, 2))).toBe(45);
  });

  it('toutes N3 → 55 (pas 45)', () => {
    expect(getAvatarScoreFromLevels(levels(3, 3, 3, 3))).toBe(55);
  });

  it('2 N3 + 2 N4 → 65', () => {
    expect(getAvatarScoreFromLevels(levels(4, 4, 3, 3))).toBe(65);
  });

  it('toutes N4 → 75', () => {
    expect(getAvatarScoreFromLevels(levels(4, 4, 4, 4))).toBe(75);
  });

  it('2 N4 + 2 N5 → 85', () => {
    expect(getAvatarScoreFromLevels(levels(5, 5, 4, 4))).toBe(85);
  });

  it('toutes N5 → 95', () => {
    expect(getAvatarScoreFromLevels(levels(5, 5, 5, 5))).toBe(95);
  });

  it('3 N5 + 1 N1 → 85 (2N4+2N5 condition)', () => {
    expect(getAvatarScoreFromLevels(levels(5, 5, 5, 1))).toBe(85);
  });
});
