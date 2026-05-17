import { supabase } from '@/lib/supabase';
import { PresetHabit, PresetBadge, PresetHabitWithBadges } from '@/lib/types';

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  return supabase;
}

export async function fetchPresetHabits(): Promise<PresetHabit[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('preset_habits')
    .select('*')
    .order('category')
    .order('name')
    .order('expertise');

  if (error) {
    console.error('Error fetching preset habits:', error);
    return [];
  }

  return data || [];
}

export async function fetchPresetHabitsWithBadges(): Promise<PresetHabitWithBadges[]> {
  const presets = await fetchPresetHabits();

  const presetsWithBadges = await Promise.all(
    presets.map(async (preset) => {
      const badges = await fetchBadgesForPreset(preset.id);
      return { ...preset, badges };
    })
  );

  return presetsWithBadges;
}

export async function fetchBadgesForPreset(presetHabitId: string): Promise<PresetBadge[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('preset_badges')
    .select('*')
    .eq('preset_habit_id', presetHabitId)
    .order('badge_level');

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }

  return data || [];
}

export async function fetchPresetHabitsByCategory(category: string): Promise<PresetHabit[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('preset_habits')
    .select('*')
    .eq('category', category)
    .order('name')
    .order('expertise');

  if (error) {
    console.error('Error fetching preset habits by category:', error);
    return [];
  }

  return data || [];
}

export async function fetchPresetHabitByNameAndExpertise(
  name: string,
  expertise: 'debutant' | 'intermediaire' | 'expert' | 'enfant' | 'ado' | 'adulte_homme' | 'adulte_femme' | 'standard'
): Promise<PresetHabit | null> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('preset_habits')
    .select('*')
    .eq('name', name)
    .eq('expertise', expertise)
    .single();

  if (error) {
    console.error('Error fetching preset habit:', error);
    return null;
  }

  return data || null;
}
