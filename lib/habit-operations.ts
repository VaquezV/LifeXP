import { supabase, SINGLE_USER_ID } from '@/lib/supabase';
import { Habit } from '@/lib/types';

export async function updateHabit(
  habitId: string,
  updates: Partial<Habit>
): Promise<Habit | null> {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .eq('user_id', SINGLE_USER_ID)
    .select()
    .single();

  if (error) {
    console.error('Error updating habit:', error);
    return null;
  }

  return data;
}

export async function deleteHabit(habitId: string): Promise<boolean> {
  const { error: logsError } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId);

  if (logsError) {
    console.error('Error deleting habit logs:', logsError);
  }

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', SINGLE_USER_ID);

  if (error) {
    console.error('Error deleting habit:', error);
    return false;
  }

  return true;
}
