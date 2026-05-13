import { supabase, SUPABASE_SETUP_MESSAGE, SINGLE_USER_ID } from './supabase';
import { Habit, CategoryType } from './types';

function ensureSupabase() {
  if (!supabase) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  return supabase;
}

/**
 * Fetch all habits, optionally filtered by user
 */
export async function fetchHabits(userId?: string): Promise<Habit[]> {
  const client = ensureSupabase();
  const filterUserId = userId || SINGLE_USER_ID;

  const { data, error } = await client
    .from('habits')
    .select('*')
    .eq('user_id', filterUserId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Habit[];
}

/**
 * Fetch habits by category, optionally filtered by user
 */
export async function fetchHabitsByCategory(
  category: CategoryType,
  userId?: string,
): Promise<Habit[]> {
  const client = ensureSupabase();
  let query = client
    .from('habits')
    .select('*')
    .eq('category', category);

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('user_id', SINGLE_USER_ID);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Habit[];
}

/**
 * Create a new habit
 */
export async function createHabit(habit: Omit<Habit, 'id' | 'created_at'>): Promise<Habit> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('habits')
    .insert({
      ...habit,
      user_id: habit.user_id || SINGLE_USER_ID,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create habit');
  }

  return data as Habit;
}

/**
 * Update an existing habit
 */
export async function updateHabit(
  habitId: string,
  updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at'>>,
): Promise<Habit> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to update habit');
  }

  return data as Habit;
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from('habits')
    .delete()
    .eq('id', habitId);

  if (error) {
    throw error;
  }
}
