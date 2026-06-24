// lib/category-progress.ts
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { requireUserId } from './auth';
import { CategoryProgress, CategoryType, CATEGORY_KEYS } from './types';

function ensureSupabase() {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE);
  return supabase;
}

export function defaultCategoryProgress(userId: string, category: CategoryType): CategoryProgress {
  return {
    user_id: userId,
    category,
    current_level: 1,
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

export async function fetchCategoryProgress(): Promise<Record<CategoryType, CategoryProgress>> {
  const client = ensureSupabase();
  const userId = await requireUserId();
  const { data, error } = await client
    .from('category_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  const defaults = defaultAllCategoryProgress(userId);
  for (const row of (data ?? []) as CategoryProgress[]) {
    defaults[row.category as CategoryType] = row;
  }
  return defaults;
}
