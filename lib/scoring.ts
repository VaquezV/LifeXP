// lifexp/lib/scoring.ts
import { Habit } from './types';

/**
 * Calculate daily completion % for a per_day habit
 * if value < min_value: % = 0
 * if value >= target_value: % = 100
 * else: linear interpolation
 */
export function calculatePerDayCompletion(
  habit: Habit,
  value: number
): number {
  if (habit.frequency_type !== 'per_day') {
    throw new Error('calculatePerDayCompletion: habit must be per_day type');
  }

  if (value < habit.min_value) {
    return 0;
  }
  if (value >= habit.target_value) {
    return 100;
  }

  const range = habit.target_value - habit.min_value;
  if (range === 0) return value >= habit.target_value ? 100 : 0;
  const progress = value - habit.min_value;
  return Math.round((progress / range) * 100);
}

/**
 * Calculate daily completion % for a times_per_day habit
 * % = (value / target_value) * 100, clamped [0, 100]
 */
export function calculateTimesPerDayCompletion(
  habit: Habit,
  value: number
): number {
  if (habit.frequency_type !== 'times_per_day') {
    throw new Error('calculateTimesPerDayCompletion: habit must be times_per_day type');
  }

  if (habit.target_value === 0) return 0;
  const percentage = (value / habit.target_value) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

/**
 * Calculate weekly completion % for a times_per_week habit
 * % = (total_week_value / target_value) * 100, clamped [0, 100]
 */
export function calculateTimesPerWeekCompletion(
  habit: Habit,
  weekTotalValue: number
): number {
  if (habit.frequency_type !== 'times_per_week') {
    throw new Error('calculateTimesPerWeekCompletion: habit must be times_per_week type');
  }

  if (habit.target_value === 0) return 0;
  const percentage = (weekTotalValue / habit.target_value) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

/**
 * Generic function: calculate % for any habit + value
 * For times_per_week, pass the SUM of values from all 7 days
 */
export function calculateHabitCompletion(
  habit: Habit,
  value: number
): number {
  switch (habit.frequency_type) {
    case 'per_day':
      return calculatePerDayCompletion(habit, value);
    case 'times_per_day':
      return calculateTimesPerDayCompletion(habit, value);
    case 'times_per_week':
      return calculateTimesPerWeekCompletion(habit, value);
    default:
      throw new Error(`Unknown frequency type: ${habit.frequency_type}`);
  }
}

/**
 * Calculate average completion % across all habits for a given day
 * Only includes daily habits (per_day, times_per_day)
 * Used for coloring day headers
 */
export function calculateDayCompletion(
  habits: Habit[],
  dailyValues: Record<string, number> // habit_id -> value
): number {
  const dailyHabits = habits.filter(h => h.frequency_type !== 'times_per_week');

  if (dailyHabits.length === 0) {
    return 0;
  }

  const total = dailyHabits.reduce((sum, habit) => {
    const value = dailyValues[habit.id] ?? 0;
    return sum + calculateHabitCompletion(habit, value);
  }, 0);

  return Math.round(total / dailyHabits.length);
}

/**
 * Calculate weekly score: average of all habit completions across 7 days
 * For daily habits: use each day's value
 * For weekly habits: use the summed value across all 7 days
 */
export function calculateWeeklyScore(
  habits: Habit[],
  weekLogs: Record<string, Record<string, number>> // date -> (habit_id -> value)
): number {
  const dates = Object.keys(weekLogs).sort();
  if (dates.length === 0) {
    return 0;
  }

  // Build week total for each habit
  const habitWeekTotals: Record<string, number> = {};
  habits.forEach(habit => {
    habitWeekTotals[habit.id] = 0;
  });

  dates.forEach(date => {
    Object.entries(weekLogs[date] ?? {}).forEach(([habitId, value]) => {
      if (habitWeekTotals[habitId] !== undefined) {
        habitWeekTotals[habitId] += value;
      }
    });
  });

  // Calculate completion % for each habit
  const completionPercentages: number[] = [];
  habits.forEach(habit => {
    const weekTotal = habitWeekTotals[habit.id] ?? 0;

    if (habit.frequency_type === 'times_per_week') {
      // Use week total
      completionPercentages.push(calculateHabitCompletion(habit, weekTotal));
    } else {
      // For daily habits: score each day, then average the scores
      const dailyScores: number[] = [];
      dates.forEach(date => {
        const dayValue = weekLogs[date]?.[habit.id] ?? 0;
        dailyScores.push(calculateHabitCompletion(habit, dayValue));
      });
      completionPercentages.push(Math.round(dailyScores.reduce((sum, s) => sum + s, 0) / dates.length));
    }
  });

  if (completionPercentages.length === 0) {
    return 0;
  }

  const average = completionPercentages.reduce((sum, pct) => sum + pct, 0) / completionPercentages.length;
  return Math.round(average);
}
