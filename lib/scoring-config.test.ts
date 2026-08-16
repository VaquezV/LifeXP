// lib/scoring-config.test.ts
import { applyPtsScale, calcHabitCompletionPct } from './scoring-config';
import { Habit, PtsScaleEntry } from './types';

const N1_SCALE: PtsScaleEntry[] = [
  { pct: 80, pts: 1 },
  { pct: 85, pts: 2 },
  { pct: 90, pts: 3 },
  { pct: 95, pts: 4 },
  { pct: 100, pts: 5 },
];

const N5_SCALE: PtsScaleEntry[] = [
  { pct: 95, pts: 1 },
  { pct: 97, pts: 3 },
  { pct: 99, pts: 4 },
  { pct: 100, pts: 5 },
];

describe('applyPtsScale', () => {
  it('retourne 0 si pct est en dessous du seuil minimum N1', () => {
    expect(applyPtsScale(N1_SCALE, 0)).toBe(0);
    expect(applyPtsScale(N1_SCALE, 79)).toBe(0);
  });

  it('retourne 1 au seuil minimum N1 (80%)', () => {
    expect(applyPtsScale(N1_SCALE, 80)).toBe(1);
    expect(applyPtsScale(N1_SCALE, 84)).toBe(1);
  });

  it('retourne 5 à 100% N1', () => {
    expect(applyPtsScale(N1_SCALE, 100)).toBe(5);
  });

  it('utilise le palier le plus haut atteint', () => {
    expect(applyPtsScale(N1_SCALE, 90)).toBe(3);
    expect(applyPtsScale(N1_SCALE, 95)).toBe(4);
    expect(applyPtsScale(N1_SCALE, 97)).toBe(4);
  });

  it('retourne 0 si pct < 95 au N5', () => {
    expect(applyPtsScale(N5_SCALE, 94)).toBe(0);
  });

  it('N5 saute de 1 à 3 pts (pas de palier à 2)', () => {
    expect(applyPtsScale(N5_SCALE, 95)).toBe(1);
    expect(applyPtsScale(N5_SCALE, 96)).toBe(1);
    expect(applyPtsScale(N5_SCALE, 97)).toBe(3);
  });
});

describe('calcHabitCompletionPct', () => {
  it('calcule une durée hebdomadaire avec la somme des 7 derniers jours', () => {
    const habit: Pick<Habit, 'id' | 'frequency_type' | 'min_value' | 'target_value'> = {
      id: 'duration',
      frequency_type: 'duration_per_week',
      min_value: 0,
      target_value: 240,
    };
    const logs = {
      '2026-08-10': { duration: 30 },
      '2026-08-12': { duration: 60 },
      '2026-08-15': { duration: 30 },
    };

    expect(calcHabitCompletionPct(habit, logs)).toBe(50);
  });
});
