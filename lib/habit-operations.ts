import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/lib/auth';
import { Habit } from '@/lib/types';

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  return supabase;
}

export async function updateHabit(
  habitId: string,
  updates: Partial<Habit>
): Promise<Habit | null> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .eq('user_id', await requireUserId())
    .select()
    .single();

  if (error) {
    console.error('Error updating habit:', error);
    return null;
  }

  return data;
}

export async function deleteHabit(habitId: string): Promise<boolean> {
  const client = ensureSupabase();
  const { error: logsError } = await client
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId);

  if (logsError) {
    console.error('Error deleting habit logs:', logsError);
  }

  const { error } = await client
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', await requireUserId());

  if (error) {
    console.error('Error deleting habit:', error);
    return false;
  }

  return true;
}
