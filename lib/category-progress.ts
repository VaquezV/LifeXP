// lib/category-progress.ts
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { requireUserId } from './auth';
import { CategoryProgress, CategoryType, CATEGORY_KEYS } from './types';
import { fetchScoringConfig, SCORING_CONFIG_FALLBACK } from './scoring-config';

function ensureSupabase() {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE);
  return supabase;
}

export function defaultCategoryProgress(userId: string, category: CategoryType): CategoryProgress {
  return {
    user_id: userId,
    category,
    current_level: 0,
    points_in_level: 0,
    last_maintenance_date: null,
    updated_at: new Date().toISOString(),
  };
}

export function defaultAllCategoryProgress(userId: string): Record<CategoryType, CategoryProgress> {
  return Object.fromEntries(
    CATEGORY_KEYS.map(cat => [cat, defaultCategoryProgress(userId, cat)])
  ) as Record<CategoryType, CategoryProgress>;
}

// Calculate category levels from actual domain scores (replaces empty category_progress table)
async function calculateCategoryProgressFromDomainScores(userId: string): Promise<Record<CategoryType, CategoryProgress>> {
  const client = ensureSupabase();

  // Fetch all domain scores for this user
  const { data: domainScores, error: scoresError } = await client
    .from('domain_scores')
    .select('domain, score')
    .eq('user_id', userId)
    .order('checkin_id', { ascending: false });

  if (scoresError) throw scoresError;

  // Fetch scoring config to determine level thresholds
  let scoringConfigs;
  try {
    scoringConfigs = await fetchScoringConfig();
  } catch {
    scoringConfigs = SCORING_CONFIG_FALLBACK;
  }

  // Group scores by domain/category and calculate levels
  const domainScoreMap = new Map<string, number[]>();
  for (const ds of (domainScores ?? [])) {
    if (!domainScoreMap.has(ds.domain)) {
      domainScoreMap.set(ds.domain, []);
    }
    domainScoreMap.get(ds.domain)!.push(ds.score);
  }

  // Calculate level for each category based on average domain score
  const progress: Record<CategoryType, CategoryProgress> = defaultAllCategoryProgress(userId);

  for (const category of CATEGORY_KEYS) {
    const scores = domainScoreMap.get(category) ?? [];
    if (scores.length === 0) continue;

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Find level based on score thresholds from scoring config
    let level = 0;
    let pointsInLevel = Math.round(avgScore);

    for (const config of scoringConfigs) {
      if (avgScore >= config.min_completion_pct) {
        level = Math.max(level, config.level);
      }
    }

    // Cap at level 5
    level = Math.min(level, 5);

    progress[category] = {
      user_id: userId,
      category,
      current_level: level,
      points_in_level: pointsInLevel,
      last_maintenance_date: null,
      updated_at: new Date().toISOString(),
    };
  }

  return progress;
}

export async function fetchCategoryProgress(): Promise<Record<CategoryType, CategoryProgress>> {
  const client = ensureSupabase();
  const userId = await requireUserId();

  // First try to get from category_progress table
  const { data, error } = await client
    .from('category_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  // If table has data, use it
  if (data && data.length > 0) {
    const defaults = defaultAllCategoryProgress(userId);
    for (const row of data as CategoryProgress[]) {
      defaults[row.category as CategoryType] = row;
    }
    return defaults;
  }

  // If table is empty, calculate from domain scores
  return calculateCategoryProgressFromDomainScores(userId);
}
