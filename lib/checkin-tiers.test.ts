import { niceStep, getAvailableTiers, formatCheckinValue } from './checkin-tiers';

describe('niceStep', () => {
  it('arrondit au multiple {1,2,5}×10ⁿ le plus proche', () => {
    expect(niceStep(1667)).toBe(2000);
    expect(niceStep(183)).toBe(200);
    expect(niceStep(12)).toBe(10);
  });

  it('retourne 1 pour des valeurs très petites', () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(1)).toBe(1);
  });
});

describe('getAvailableTiers — unit_per_day', () => {
  it('10000 pas/jour: min à target, target garanti en dernier', () => {
    const tiers = getAvailableTiers({ frequency_type: 'unit_per_day', min_value: 0, target_value: 10000 });
    expect(tiers[0]).toBe(0);
    expect(tiers[tiers.length - 1]).toBe(10000);
    expect(tiers.length).toBeLessThanOrEqual(7);
    expect(new Set(tiers).size).toBe(tiers.length); // pas de doublons
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b)); // croissant
  });

  it('respecte un min_value non nul', () => {
    const tiers = getAvailableTiers({ frequency_type: 'unit_per_day', min_value: 2000, target_value: 8000 });
    expect(tiers[0]).toBe(2000);
    expect(tiers[tiers.length - 1]).toBe(8000);
  });

  it('petit objectif reste cohérent (pas de palier > target)', () => {
    const tiers = getAvailableTiers({ frequency_type: 'unit_per_day', min_value: 0, target_value: 5 });
    expect(tiers[tiers.length - 1]).toBe(5);
    expect(tiers.every(v => v <= 5)).toBe(true);
  });
});

describe('getAvailableTiers — unit_per_week', () => {
  it('7000 kcal/semaine: dernier palier = plafond (target/7)*1.5 = 1500, pas l\'objectif brut', () => {
    const tiers = getAvailableTiers({ frequency_type: 'unit_per_week', min_value: 0, target_value: 7000 });
    expect(tiers[0]).toBe(0);
    expect(tiers[tiers.length - 1]).toBe(1500);
    expect(tiers.includes(7000)).toBe(false);
  });
});

describe('getAvailableTiers — types existants inchangés', () => {
  it('times_per_week → [0, 1]', () => {
    expect(getAvailableTiers({ frequency_type: 'times_per_week', min_value: 0, target_value: 3 })).toEqual([0, 1]);
  });

  it('times_per_day → 0..target', () => {
    expect(getAvailableTiers({ frequency_type: 'times_per_day', min_value: 0, target_value: 3 })).toEqual([0, 1, 2, 3]);
  });

  it('per_day → paliers legacy avec target garanti', () => {
    const tiers = getAvailableTiers({ frequency_type: 'per_day', min_value: 30, target_value: 60 });
    expect(tiers[0]).toBe(30);
    expect(tiers[tiers.length - 1]).toBe(60);
  });
});

describe('formatCheckinValue', () => {
  it('unit_per_day avec unit_label', () => {
    expect(formatCheckinValue({ frequency_type: 'unit_per_day', unit_label: 'pas' }, 5000)).toBe('5000 pas');
  });

  it('unit_per_week sans unit_label', () => {
    expect(formatCheckinValue({ frequency_type: 'unit_per_week', unit_label: null }, 3500)).toBe('3500');
  });

  it('per_day formate en minutes/heures', () => {
    expect(formatCheckinValue({ frequency_type: 'per_day' }, 45)).toBe('45m');
    expect(formatCheckinValue({ frequency_type: 'per_day' }, 90)).toBe('1h30');
  });
});
