// lib/scoring-config.ts
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { ScoringConfig, PtsScaleEntry } from './types';
import { SCORING_CONFIG_FALLBACK } from './scoring-fallback';

export { SCORING_CONFIG_FALLBACK };

export function applyPtsScale(scale: PtsScaleEntry[], completionPct: number): number {
  let result = 0;
  for (const entry of scale) {
    if (completionPct >= entry.pct) result = entry.pts;
  }
  return result;
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
