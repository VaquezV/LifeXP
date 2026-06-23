import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { requireUserId } from './auth';
import type { MomentumTrend } from './momentum';

export interface MomentumRecord {
  user_id:           string;
  momentum_selfcare: number;
  momentum_devperso: number;
  momentum_famille:  number;
  momentum_pro:      number;
  trend_selfcare:    MomentumTrend;
  trend_devperso:    MomentumTrend;
  trend_famille:     MomentumTrend;
  trend_pro:         MomentumTrend;
  last_updated:      string;
}

function ensureSupabase() {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE);
  return supabase;
}

export function defaultMomentumRecord(userId: string): MomentumRecord {
  return {
    user_id:           userId,
    momentum_selfcare: 0,
    momentum_devperso: 0,
    momentum_famille:  0,
    momentum_pro:      0,
    trend_selfcare:    'stable',
    trend_devperso:    'stable',
    trend_famille:     'stable',
    trend_pro:         'stable',
    last_updated:      new Date().toISOString().split('T')[0],
  };
}

export async function fetchMomentum(userId?: string): Promise<MomentumRecord | null> {
  const client = ensureSupabase();
  const uid = userId ?? (await requireUserId());
  const { data, error } = await client
    .from('category_momentum')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;
  return (data as MomentumRecord) ?? null;
}
