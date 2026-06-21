import {
  calculatePerDayCompletion,
  calculateTimesPerDayCompletion,
  calculateTimesPerWeekCompletion,
  calculateDayCompletion,
  calculateWeeklyScore,
} from './scoring';
import { Habit } from './types';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    user_id: 'u1',
    name: 'Test',
    emoji: '⭐',
    category: 'self_care',
    description: null,
    frequency_type: 'per_day',
    frequency_value: 1,
    min_value: 30,
    target_value: 60,
    max_value: null,
    preset_habit_id: null,
    created_at: '2026-01-01',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculatePerDayCompletion
// ---------------------------------------------------------------------------
describe('calculatePerDayCompletion', () => {
  const habit = makeHabit({ frequency_type: 'per_day', min_value: 30, target_value: 60 });

  it('retourne 0 si value < min_value', () => {
    expect(calculatePerDayCompletion(habit, 10)).toBe(0);
    expect(calculatePerDayCompletion(habit, 29)).toBe(0);
  });

  it('retourne 100 si value >= target_value', () => {
    expect(calculatePerDayCompletion(habit, 60)).toBe(100);
    expect(calculatePerDayCompletion(habit, 90)).toBe(100);
  });

  it('interpolation linéaire entre min et target', () => {
    expect(calculatePerDayCompletion(habit, 30)).toBe(0);   // min → 0%
    expect(calculatePerDayCompletion(habit, 45)).toBe(50);  // milieu → 50%
    expect(calculatePerDayCompletion(habit, 54)).toBe(80);  // 24/30 ≈ 80%
  });

  it('lève une erreur pour un type de fréquence incompatible', () => {
    const timesHabit = makeHabit({ frequency_type: 'times_per_day' });
    expect(() => calculatePerDayCompletion(timesHabit, 1)).toThrow();
  });

  it('BUG CONFIRMÉ: target_value=0 retourne 100 même avec value=0 (0 >= 0)', () => {
    const zeroTarget = makeHabit({ frequency_type: 'per_day', min_value: 0, target_value: 0 });
    // Si l'utilisateur efface le champ objectif (parseInt('') || 0 = 0),
    // le scoring retourne 100 — l'habitude est toujours complète.
    expect(calculatePerDayCompletion(zeroTarget, 0)).toBe(100);
    // Ce comportement est un bug: il devrait retourner 0 (guard manquant).
  });

  it('habituation marche: 8000-10000 pas, value=9000', () => {
    const marche = makeHabit({ frequency_type: 'per_day', min_value: 8000, target_value: 10000 });
    expect(calculatePerDayCompletion(marche, 8000)).toBe(0);
    expect(calculatePerDayCompletion(marche, 9000)).toBe(50);
    expect(calculatePerDayCompletion(marche, 10000)).toBe(100);
  });

  it('sommeil: min=6h(360min), target=8h(480min), value=7h(420min)', () => {
    const sommeil = makeHabit({ frequency_type: 'per_day', min_value: 360, target_value: 480 });
    expect(calculatePerDayCompletion(sommeil, 360)).toBe(0);
    expect(calculatePerDayCompletion(sommeil, 420)).toBe(50);
    expect(calculatePerDayCompletion(sommeil, 480)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// calculateTimesPerDayCompletion
// ---------------------------------------------------------------------------
describe('calculateTimesPerDayCompletion', () => {
  const habit = makeHabit({ frequency_type: 'times_per_day', target_value: 3 });

  it('0 fois → 0%', () => expect(calculateTimesPerDayCompletion(habit, 0)).toBe(0));
  it('objectif atteint → 100%', () => expect(calculateTimesPerDayCompletion(habit, 3)).toBe(100));
  it('dépassement clampé à 100%', () => expect(calculateTimesPerDayCompletion(habit, 5)).toBe(100));
  it('interpolation: 1/3 ≈ 33%', () => expect(calculateTimesPerDayCompletion(habit, 1)).toBe(33));
  it('target_value=0 protégé → 0%', () => {
    const h = makeHabit({ frequency_type: 'times_per_day', target_value: 0 });
    expect(calculateTimesPerDayCompletion(h, 0)).toBe(0);
  });
  it('traitement 1x/jour: 1 prise → 100%', () => {
    const traitement = makeHabit({ frequency_type: 'times_per_day', target_value: 1 });
    expect(calculateTimesPerDayCompletion(traitement, 1)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// calculateTimesPerWeekCompletion
// ---------------------------------------------------------------------------
describe('calculateTimesPerWeekCompletion', () => {
  const habit = makeHabit({ frequency_type: 'times_per_week', target_value: 3 });

  it('0 séances → 0%', () => expect(calculateTimesPerWeekCompletion(habit, 0)).toBe(0));
  it('objectif atteint → 100%', () => expect(calculateTimesPerWeekCompletion(habit, 3)).toBe(100));
  it('dépassement clampé à 100%', () => expect(calculateTimesPerWeekCompletion(habit, 6)).toBe(100));
  it('2/3 séances ≈ 67%', () => expect(calculateTimesPerWeekCompletion(habit, 2)).toBe(67));
  it('Courses 3x/semaine: 2 → 67%', () => {
    const courses = makeHabit({ frequency_type: 'times_per_week', target_value: 3 });
    expect(calculateTimesPerWeekCompletion(courses, 2)).toBe(67);
  });
});

// ---------------------------------------------------------------------------
// calculateDayCompletion
// ---------------------------------------------------------------------------
describe('calculateDayCompletion', () => {
  it('retourne 0 sans habitudes', () => {
    expect(calculateDayCompletion([], {})).toBe(0);
  });

  it('exclut les habitudes times_per_week du calcul journalier', () => {
    const weekly = makeHabit({ id: 'w1', frequency_type: 'times_per_week', target_value: 3 });
    const daily = makeHabit({ id: 'd1', frequency_type: 'per_day', min_value: 0, target_value: 60 });
    const values = { d1: 60 }; // daily complète, weekly ignorée
    expect(calculateDayCompletion([weekly, daily], values)).toBe(100);
  });

  it('moyenne de plusieurs habitudes quotidiennes', () => {
    const h1 = makeHabit({ id: 'h1', frequency_type: 'per_day', min_value: 0, target_value: 100 });
    const h2 = makeHabit({ id: 'h2', frequency_type: 'per_day', min_value: 0, target_value: 100 });
    const values = { h1: 100, h2: 0 }; // 100% + 0% = 50%
    expect(calculateDayCompletion([h1, h2], values)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// calculateWeeklyScore
// ---------------------------------------------------------------------------
describe('calculateWeeklyScore', () => {
  it('retourne 0 sans dates', () => {
    const habit = makeHabit({ frequency_type: 'per_day', min_value: 0, target_value: 60 });
    expect(calculateWeeklyScore([habit], {})).toBe(0);
  });

  it('habitude per_day complète tous les jours → 100%', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'per_day', min_value: 0, target_value: 60 });
    const weekLogs = {
      '2026-06-15': { h1: 60 },
      '2026-06-16': { h1: 60 },
      '2026-06-17': { h1: 60 },
    };
    expect(calculateWeeklyScore([habit], weekLogs)).toBe(100);
  });

  it('habitude per_day: 4/7 jours → moins de 100%', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'per_day', min_value: 0, target_value: 60 });
    const weekLogs = {
      '2026-06-15': { h1: 60 },
      '2026-06-16': { h1: 60 },
      '2026-06-17': { h1: 60 },
      '2026-06-18': { h1: 60 },
      '2026-06-19': { h1: 0 },
      '2026-06-20': { h1: 0 },
      '2026-06-21': { h1: 0 },
    };
    expect(calculateWeeklyScore([habit], weekLogs)).toBe(57); // 4/7 ≈ 57%
  });

  it('habitude times_per_week: total semaine utilisé (pas par jour)', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'times_per_week', target_value: 3 });
    const weekLogs = {
      '2026-06-15': { h1: 1 },
      '2026-06-17': { h1: 1 },
      '2026-06-19': { h1: 1 },
    };
    expect(calculateWeeklyScore([habit], weekLogs)).toBe(100); // 3 total = objectif
  });
});
