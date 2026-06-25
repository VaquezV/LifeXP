import {
  getWolfTierIndex,
  getWolfClass,
  getNextClass,
  getStarString,
  getAccessoryName,
  computeTotalXP,
  getNextLevelText,
  getRandomMantra,
} from './wolf-data';
import type { CategoryType, CategoryProgress } from './types';
import { SCORING_CONFIG_FALLBACK } from './scoring-config';

function lvl(sc: number, dp: number, vf: number, vp: number): Record<CategoryType, number> {
  return { self_care: sc, dev_perso: dp, vie_familiale: vf, vie_pro: vp };
}

function prog(sc: number, dp: number, vf: number, vp: number, pts = 0): Record<CategoryType, CategoryProgress> {
  const make = (category: CategoryType, level: number): CategoryProgress => ({
    user_id: '', category, current_level: level, points_in_level: pts,
    last_maintenance_date: null, updated_at: '',
  });
  return {
    self_care:     make('self_care', sc),
    dev_perso:     make('dev_perso', dp),
    vie_familiale: make('vie_familiale', vf),
    vie_pro:       make('vie_pro', vp),
  };
}

describe('getWolfTierIndex', () => {
  it('score 5 → tier 0', () => expect(getWolfTierIndex(5)).toBe(0));
  it('score 15 → tier 1', () => expect(getWolfTierIndex(15)).toBe(1));
  it('score 35 → tier 3', () => expect(getWolfTierIndex(35)).toBe(3));
  it('score 95 → tier 9', () => expect(getWolfTierIndex(95)).toBe(9));
});

describe('getWolfClass', () => {
  it('score 5 → Louveteau des Cendres', () =>
    expect(getWolfClass(5)).toBe('Louveteau des Cendres'));
  it('score 15 → Éveil des Frimas', () =>
    expect(getWolfClass(15)).toBe('Éveil des Frimas'));
  it('score 95 → Loup Dieu des Origines', () =>
    expect(getWolfClass(95)).toBe('Loup Dieu des Origines'));
});

describe('getNextClass', () => {
  it('score 5 → Éveil des Frimas', () =>
    expect(getNextClass(5)).toBe('Éveil des Frimas'));
  it('score 85 → Loup Dieu des Origines', () =>
    expect(getNextClass(85)).toBe('Loup Dieu des Origines'));
  it('score 95 → null', () => expect(getNextClass(95)).toBeNull());
});

describe('getStarString', () => {
  it('tier 0 (score 5) → 1 étoile remplie', () =>
    expect(getStarString(5)).toBe('★☆☆☆☆☆☆☆☆☆'));
  it('tier 4 (score 45) → 5 étoiles remplies', () =>
    expect(getStarString(45)).toBe('★★★★★☆☆☆☆☆'));
  it('tier 9 (score 95) → 10 étoiles remplies', () =>
    expect(getStarString(95)).toBe('★★★★★★★★★★'));
});

describe('getAccessoryName', () => {
  it('Antre niv1 → Tanière des Cendres', () =>
    expect(getAccessoryName('self_care', 1)).toBe('Tanière des Cendres'));
  it('Antre niv3 → Refuge des Forêts', () =>
    expect(getAccessoryName('self_care', 3)).toBe('Refuge des Forêts'));
  it('Antre niv5 → Caverne des Cristaux', () =>
    expect(getAccessoryName('self_care', 5)).toBe('Caverne des Cristaux'));
  it('Cri niv2 → Grondement des Plaines', () =>
    expect(getAccessoryName('dev_perso', 2)).toBe('Grondement des Plaines'));
  it('Cri niv5 → Chant des Origines', () =>
    expect(getAccessoryName('dev_perso', 5)).toBe('Chant des Origines'));
  it('Meute niv2 → Duo des Lisières', () =>
    expect(getAccessoryName('vie_familiale', 2)).toBe('Duo des Lisières'));
  it('Totem niv4 → Totem Ardent', () =>
    expect(getAccessoryName('vie_pro', 4)).toBe('Totem Ardent'));
  it('Totem niv5 → Totem Divin', () =>
    expect(getAccessoryName('vie_pro', 5)).toBe('Totem Divin'));
});

describe('computeTotalXP', () => {
  it('tous N1, 0 pts → 0 XP', () =>
    expect(computeTotalXP(prog(1, 1, 1, 1, 0), SCORING_CONFIG_FALLBACK)).toBe(0));
  it('tous N1, 10 pts chacun → 40 XP', () =>
    expect(computeTotalXP(prog(1, 1, 1, 1, 10), SCORING_CONFIG_FALLBACK)).toBe(40));
  it('tous N2, 0 pts → 200 XP (4×50)', () =>
    expect(computeTotalXP(prog(2, 2, 2, 2, 0), SCORING_CONFIG_FALLBACK)).toBe(200));
  it('Antre N3 reste N1, 0 pts → 115 XP (50+65 pour Antre)', () =>
    expect(computeTotalXP(prog(3, 1, 1, 1, 0), SCORING_CONFIG_FALLBACK)).toBe(115));
  it('tous N2, 5 pts chacun → 220 XP', () =>
    expect(computeTotalXP(prog(2, 2, 2, 2, 5), SCORING_CONFIG_FALLBACK)).toBe(220));
});

describe('getNextLevelText', () => {
  it('tous N1 (score 5) → Antre niv2', () =>
    expect(getNextLevelText(lvl(1, 1, 1, 1))).toBe('Antre niv2'));
  it('Antre N2, reste N1 (score 15) → Cri niv2', () =>
    expect(getNextLevelText(lvl(2, 1, 1, 1))).toBe('Cri niv2'));
  it('Antre+Cri N2, reste N1 (score 25) → Meute niv2, Totem niv2', () =>
    expect(getNextLevelText(lvl(2, 2, 1, 1))).toBe('Meute niv2, Totem niv2'));
  it('tous N2 (score 35) → Antre niv3, Cri niv3', () =>
    expect(getNextLevelText(lvl(2, 2, 2, 2))).toBe('Antre niv3, Cri niv3'));
  it('Antre+Cri N3, reste N2 (score 45) → Meute niv3, Totem niv3', () =>
    expect(getNextLevelText(lvl(3, 3, 2, 2))).toBe('Meute niv3, Totem niv3'));
  it('tous N3 (score 55) → Antre niv4, Cri niv4', () =>
    expect(getNextLevelText(lvl(3, 3, 3, 3))).toBe('Antre niv4, Cri niv4'));
  it('tous N5 (score 95) → —', () =>
    expect(getNextLevelText(lvl(5, 5, 5, 5))).toBe('—'));
});

describe('getRandomMantra', () => {
  it('tier 0 → retourne une string non vide', () => {
    expect(typeof getRandomMantra(0)).toBe('string');
    expect(getRandomMantra(0).length).toBeGreaterThan(0);
  });
  it('tier 9 → retourne une string non vide', () => {
    expect(getRandomMantra(9).length).toBeGreaterThan(0);
  });
  it('tier out-of-range (10) → clamp sur tier 9, string non vide', () => {
    expect(getRandomMantra(10).length).toBeGreaterThan(0);
  });
});
