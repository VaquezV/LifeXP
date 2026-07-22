// lib/scoring-config.ts
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { Habit, ScoringConfig, PtsScaleEntry } from './types';
import { SCORING_CONFIG_FALLBACK } from './scoring-fallback';

export { SCORING_CONFIG_FALLBACK };

export function applyPtsScale(scale: PtsScaleEntry[], completionPct: number): number {
  let result = 0;
  for (const entry of scale) {
    if (completionPct >= entry.pct) result = entry.pts;
  }
  return result;
}

/** 7-day rolling completion %, mirrors supabase/functions/apply-daily-scoring so client previews match the edge function's payout. */
export function calcHabitCompletionPct(
  habit: Pick<Habit, 'id' | 'frequency_type' | 'min_value' | 'target_value'>,
  weekLogs: Record<string, Record<string, number>>
): number {
  const dates = Object.keys(weekLogs).sort();
  if (dates.length === 0) return 0;

  if (habit.frequency_type === 'times_per_week') {
    const total = dates.reduce((s, d) => s + (weekLogs[d]?.[habit.id] ?? 0), 0);
    return habit.target_value === 0 ? 0 : Math.min(100, Math.round((total / habit.target_value) * 100));
  }

  const dayScores: number[] = [];
  for (const date of dates) {
    const v = weekLogs[date]?.[habit.id] ?? 0;
    let pct = 0;
    if (habit.frequency_type === 'per_day') {
      if (v < habit.min_value) pct = 0;
      else if (v >= habit.target_value) pct = 100;
      else {
        const range = habit.target_value - habit.min_value;
        pct = range === 0 ? 100 : Math.round(((v - habit.min_value) / range) * 100);
      }
    } else {
      pct = habit.target_value === 0 ? 0 : Math.max(0, Math.min(100, Math.round((v / habit.target_value) * 100)));
    }
    dayScores.push(pct);
  }
  return Math.round(dayScores.reduce((s, p) => s + p, 0) / dayScores.length);
}

/** Sum of pts_scale payouts for a category's habits, i.e. the "+X" the daily-scoring edge function would credit today. */
export function calcCategoryProjectedGain(
  habits: Habit[],
  weekLogs: Record<string, Record<string, number>>,
  config: ScoringConfig
): number {
  return habits.reduce(
    (sum, habit) => sum + applyPtsScale(config.pts_scale, calcHabitCompletionPct(habit, weekLogs)),
    0
  );
}

export function getScoringConfigForLevel(configs: ScoringConfig[], level: number): ScoringConfig {
  return configs.find(c => c.level === level) ?? configs[0] ?? SCORING_CONFIG_FALLBACK[0];
}

export async function fetchScoringConfig(): Promise<ScoringConfig[]> {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE);
  const { data, error } = await supabase
    .from('scoring_config')
    .select('*')
    .order('level', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScoringConfig[];
}
