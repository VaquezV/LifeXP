import { requireUserId } from './auth';
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';

/**
 * Deletes the current user's habits and their logs, then resets Sanctuary
 * progression in one database transaction.
 */
export async function resetSanctuary(): Promise<string> {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE);

  const userId = await requireUserId();
  const { error } = await supabase.rpc('reset_sanctuary');
  if (error) throw error;

  return userId;
}
