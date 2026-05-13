import { supabase, SUPABASE_SETUP_MESSAGE, SINGLE_USER_ID } from './supabase';
import { HabitLog } from './types';
import { addDays, toLocalDateString } from './date';

function ensureSupabase() {
  if (!supabase) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  return supabase;
}

function handlePGRST116Error(error: any) {
  // PGRST116 is "no rows found" - treat as null result, not an error
  if (error?.code === 'PGRST116') {
    return null;
  }
  throw error;
}

/**
 * Fetch habit logs for a single date
 */
export async function fetchHabitLogsForDate(
  habitId: string,
  date: string,
  userId?: string,
): Promise<HabitLog | null> {
  const client = ensureSupabase();
  const uid = userId || SINGLE_USER_ID;

  const { data, error } = await client
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .eq('user_id', uid)
    .eq('date', date)
    .maybeSingle();

  if (error) {
    return handlePGRST116Error(error);
  }

  return (data as HabitLog) || null;
}

/**
 * Fetch habit logs for a week (7 days starting from startDate)
 */
export async function fetchHabitLogsForWeek(
  habitId: string,
  startDate: string,
  userId?: string,
): Promise<HabitLog[]> {
  const client = ensureSupabase();
  const uid = userId || SINGLE_USER_ID;

  // Calculate end date (7 days from start)
  const startDateObj = new Date(startDate + 'T00:00:00Z');
  const endDateObj = addDays(startDateObj, 6);
  const endDate = toLocalDateString(endDateObj);

  const { data, error } = await client
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .eq('user_id', uid)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as HabitLog[];
}

/**
 * Upsert a habit log entry (insert or update)
 */
export async function logHabitValue(
  userId: string,
  habitId: string,
  date: string,
  value: number,
): Promise<HabitLog> {
  const client = ensureSupabase();

  const { data, error } = await client
    .from('habit_logs')
    .upsert(
      {
        user_id: userId,
        habit_id: habitId,
        date,
        value,
      },
      {
        onConflict: 'user_id,habit_id,date',
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to upsert habit log');
  }

  return data as HabitLog;
}

/**
 * Delete a habit log
 */
export async function deleteHabitLog(logId: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client
    .from('habit_logs')
    .delete()
    .eq('id', logId);

  if (error) {
    throw error;
  }
}

/**
 * Fetch all logs for a date as a Record<habit_id, value>
 */
export async function fetchAllLogsForDate(
  date: string,
  userId?: string,
): Promise<Record<string, number>> {
  const client = ensureSupabase();
  const uid = userId || SINGLE_USER_ID;

  const { data, error } = await client
    .from('habit_logs')
    .select('habit_id, value')
    .eq('user_id', uid)
    .eq('date', date);

  if (error) {
    throw error;
  }

  const record: Record<string, number> = {};
  for (const log of data ?? []) {
    record[log.habit_id] = log.value;
  }

  return record;
}
