import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { requireUserId } from './auth';
import { Habit, CategoryType } from './types';

function ensureSupabase() {
  if (!supabase) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  return supabase;
}

async function nextPositionInCategory(
  client: NonNullable<typeof supabase>,
  userId: string,
  category: CategoryType,
): Promise<number> {
  const { data, error } = await client
    .from('habits')
    .select('position')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('is_active', true)
    .order('position', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const maxPosition = data?.[0]?.position ?? -1;
  return maxPosition + 1;
}

/**
 * Fetch all active habits, optionally filtered by user
 */
export async function fetchHabits(userId?: string): Promise<Habit[]> {
  const client = ensureSupabase();
  const filterUserId = userId || (await requireUserId());

  const { data, error } = await client
    .from('habits')
    .select('*')
    .eq('user_id', filterUserId)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Habit[];
}

/**
 * Fetch active habits by category, optionally filtered by user
 */
export async function fetchHabitsByCategory(
  category: CategoryType,
  userId?: string,
): Promise<Habit[]> {
  const client = ensureSupabase();
  let query = client
    .from('habits')
    .select('*')
    .eq('category', category)
    .eq('is_active', true);

  query = query.eq('user_id', userId ?? (await requireUserId()));

  const { data, error } = await query.order('position', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Habit[];
}

/**
 * Fetch deactivated (soft-deleted) habits by category, for the reactivation list.
 */
export async function fetchInactiveHabits(
  category: CategoryType,
  userId?: string,
): Promise<Habit[]> {
  const client = ensureSupabase();
  const filterUserId = userId ?? (await requireUserId());

  const { data, error } = await client
    .from('habits')
    .select('*')
    .eq('category', category)
    .eq('user_id', filterUserId)
    .eq('is_active', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Habit[];
}

/**
 * Create a new habit, appended at the end of its category's order unless a position is given.
 */
export async function createHabit(
  habit: Omit<Habit, 'id' | 'created_at' | 'position' | 'is_active'> & {
    position?: number;
    is_active?: boolean;
  },
): Promise<Habit> {
  const client = ensureSupabase();
  const userId = habit.user_id || (await requireUserId());
  const position = habit.position ?? (await nextPositionInCategory(client, userId, habit.category));

  const { data, error } = await client
    .from('habits')
    .insert({
      ...habit,
      user_id: userId,
      position,
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
 * Soft-delete a habit (deactivate it). It stays in the database, reactivatable later,
 * and disappears from fetchHabits/fetchHabitsByCategory.
 */
export async function deleteHabit(habitId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from('habits')
    .update({ is_active: false })
    .eq('id', habitId);

  if (error) {
    throw error;
  }
}

/**
 * Reactivate a previously soft-deleted habit, appending it at the end of its category's order.
 */
export async function reactivateHabit(habitId: string): Promise<Habit> {
  const client = ensureSupabase();

  const { data: existing, error: fetchError } = await client
    .from('habits')
    .select('user_id, category')
    .eq('id', habitId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (!existing) {
    throw new Error('Habit not found');
  }

  const position = await nextPositionInCategory(client, existing.user_id, existing.category);

  const { data, error } = await client
    .from('habits')
    .update({ is_active: true, position })
    .eq('id', habitId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to reactivate habit');
  }

  return data as Habit;
}

/**
 * Moves a habit one slot up within its category's active order, swapping positions
 * with the previous habit. No-op if the habit is already first (or not found).
 */
export async function moveHabitUp(
  habitId: string,
  category: CategoryType,
  userId?: string,
): Promise<void> {
  const client = ensureSupabase();
  const filterUserId = userId ?? (await requireUserId());

  const { data, error } = await client
    .from('habits')
    .select('id, position')
    .eq('user_id', filterUserId)
    .eq('category', category)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  const ordered = data ?? [];
  const index = ordered.findIndex(h => h.id === habitId);
  if (index <= 0) {
    return;
  }

  const current = ordered[index];
  const previous = ordered[index - 1];

  const { error: currentError } = await client
    .from('habits')
    .update({ position: previous.position })
    .eq('id', current.id);

  if (currentError) {
    throw currentError;
  }

  const { error: previousError } = await client
    .from('habits')
    .update({ position: current.position })
    .eq('id', previous.id);

  if (previousError) {
    throw previousError;
  }
}

/** Removes the deleted habit from a local list, for reconciling state right after a successful deleteHabit call. Called by the home screen's handleDeleteItem. */
export function removeHabitFromList(habits: Habit[], habitId: string): Habit[] {
  return habits.filter(h => h.id !== habitId);
}
