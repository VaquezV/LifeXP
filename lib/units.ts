import { requireUserId } from './auth';
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';

/** Predefined unit suggestions offered by the app for unit_per_day / unit_per_week goals. */
export const DEFAULT_UNITS = ['pas', 'kcal', 'km', "verres d'eau", 'pages', 'min', '€'] as const;

function ensureSupabase() {
  if (!supabase) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  return supabase;
}

/** Fetches the current user's custom units, added dynamically via the unit combobox. */
export async function fetchUserUnits(): Promise<string[]> {
  const client = ensureSupabase();
  const userId = await requireUserId();

  const { data, error } = await client
    .from('user_units')
    .select('label')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.label as string);
}

/** Persists a new unit label for the current user, skipping predefined and already-saved ones. */
export async function upsertUserUnit(label: string): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed || (DEFAULT_UNITS as readonly string[]).includes(trimmed)) {
    return;
  }

  const client = ensureSupabase();
  const userId = await requireUserId();

  const { error } = await client
    .from('user_units')
    .upsert({ user_id: userId, label: trimmed }, { onConflict: 'user_id,label', ignoreDuplicates: true });

  if (error) {
    throw error;
  }
}
