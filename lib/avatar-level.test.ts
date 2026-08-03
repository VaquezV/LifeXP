// lib/avatar-level.test.ts
import { getAvatarScoreFromLevels } from './avatar-level';
import { CategoryType } from './types';

function levels(sc: number, dp: number, vf: number, vp: number): Record<CategoryType, number> {
  return { self_care: sc, dev_perso: dp, vie_familiale: vf, vie_pro: vp };
}

describe('getAvatarScoreFromLevels', () => {
  it('toutes N0 → avatar 1', () => {
    expect(getAvatarScoreFromLevels(levels(0, 0, 0, 0))).toBe(5);
  });

  it('2 catégories N1 → avatar 2', () => {
    expect(getAvatarScoreFromLevels(levels(1, 1, 0, 0))).toBe(15);
  });

  it('4 catégories N1 → avatar 3', () => {
    expect(getAvatarScoreFromLevels(levels(1, 1, 1, 1))).toBe(25);
  });

  it('2 catégories N2 → avatar 4', () => {
    expect(getAvatarScoreFromLevels(levels(2, 2, 1, 1))).toBe(35);
  });

  it('4 catégories N2 → avatar 5', () => {
    expect(getAvatarScoreFromLevels(levels(2, 2, 2, 2))).toBe(45);
  });

  it('2 catégories N3 → avatar 6', () => {
    expect(getAvatarScoreFromLevels(levels(3, 3, 2, 2))).toBe(55);
  });

  it('4 catégories N3 → avatar 7', () => {
    expect(getAvatarScoreFromLevels(levels(3, 3, 3, 3))).toBe(65);
  });

  it('2 catégories N4 → avatar 8', () => {
    expect(getAvatarScoreFromLevels(levels(4, 4, 3, 3))).toBe(75);
  });

  it('4 catégories N4 → avatar 9', () => {
    expect(getAvatarScoreFromLevels(levels(4, 4, 4, 4))).toBe(85);
  });

  it('toutes N5 → avatar 10', () => {
    expect(getAvatarScoreFromLevels(levels(5, 5, 5, 5))).toBe(95);
  });

  it('3 N5 + 1 N4 reste avatar 9', () => {
    expect(getAvatarScoreFromLevels(levels(5, 5, 5, 4))).toBe(85);
  });
});
