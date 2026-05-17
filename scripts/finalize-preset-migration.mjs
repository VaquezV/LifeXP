import { writeFile } from 'node:fs/promises';

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

const PRESET_MAPPING = [
  { habitName: 'Dents', presetName: 'Dents', expertise: 'standard' },
  { habitName: 'Douche', presetName: 'Douche', expertise: 'standard' },
  { habitName: 'Sommeil', presetName: 'Sommeil', expertise: 'adulte_homme' },
  { habitName: 'Violon', presetName: 'Musique', expertise: 'intermediaire' },
  { habitName: 'Chien', presetName: 'Chien', expertise: 'standard' },
  { habitName: 'Femme', presetName: 'Massage Partenaire', expertise: 'standard' },
  { habitName: 'Enfants', presetName: 'Enfants', expertise: 'standard' },
];

async function ensureEnfantsPreset() {
  const payload = {
    name: 'Enfants',
    category: 'vie_familiale',
    expertise: 'standard',
    emoji: '🧒',
    frequency_type: 'per_day',
    frequency_value: 1,
    min_value: 0,
    target_value: 30,
    max_value: 60,
    editable_min_value: true,
    editable_target_value: true,
    editable_max_value: true,
    editable_frequency_type: false,
    editable_frequency_value: true,
  };

  const { data, error } = await supabase
    .from('preset_habits')
    .upsert(payload, { onConflict: 'name,expertise' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const badgeDefinitions = [
    { badge_level: 1, consecutive_days: 1, badge_name: 'Premier moment', badge_emoji: '🧒' },
    { badge_level: 3, consecutive_days: 3, badge_name: 'Trois moments', badge_emoji: '🧒🧒🧒' },
    { badge_level: 7, consecutive_days: 7, badge_name: 'Une semaine', badge_emoji: '📅' },
    { badge_level: 10, consecutive_days: 10, badge_name: 'Dix moments', badge_emoji: '🎉' },
  ].map((badge) => ({
    ...badge,
    preset_habit_id: data.id,
  }));

  const { error: badgeError } = await supabase
    .from('preset_badges')
    .upsert(badgeDefinitions, { onConflict: 'preset_habit_id,badge_level' });

  if (badgeError) {
    throw badgeError;
  }

  return data;
}

async function fetchPresetMap() {
  const { data, error } = await supabase
    .from('preset_habits')
    .select('*');

  if (error) {
    throw error;
  }

  return new Map(data.map((preset) => [`${preset.name}:${preset.expertise}`, preset]));
}

async function main() {
  const report = {
    appliedAt: new Date().toISOString(),
    insertedOrUpdatedPresets: [],
    linkedHabits: [],
    backfilledLogs: 0,
    errors: [],
  };

  await ensureEnfantsPreset();
  report.insertedOrUpdatedPresets.push('Enfants:standard');

  const presetMap = await fetchPresetMap();

  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .order('created_at');

  if (habitsError) {
    throw habitsError;
  }

  for (const mapping of PRESET_MAPPING) {
    const habit = habits.find((item) => item.name === mapping.habitName);
    const preset = presetMap.get(`${mapping.presetName}:${mapping.expertise}`);

    if (!habit || !preset) {
      report.errors.push({
        type: 'missing_mapping_target',
        mapping,
        habitFound: Boolean(habit),
        presetFound: Boolean(preset),
      });
      continue;
    }

    const { error: habitUpdateError } = await supabase
      .from('habits')
      .update({
        preset_habit_id: preset.id,
        max_value: habit.max_value ?? preset.max_value,
      })
      .eq('id', habit.id);

    if (habitUpdateError) {
      report.errors.push({
        type: 'habit_update_failed',
        habitId: habit.id,
        message: habitUpdateError.message,
        code: habitUpdateError.code,
      });
      continue;
    }

    const { data: updatedLogs, error: logsUpdateError } = await supabase
      .from('habit_logs')
      .update({ preset_habit_id: preset.id })
      .eq('habit_id', habit.id)
      .select('id');

    if (logsUpdateError) {
      report.errors.push({
        type: 'logs_update_failed',
        habitId: habit.id,
        message: logsUpdateError.message,
        code: logsUpdateError.code,
      });
      continue;
    }

    report.linkedHabits.push({
      habitId: habit.id,
      habitName: habit.name,
      presetId: preset.id,
      presetName: preset.name,
      expertise: preset.expertise,
      updatedLogs: updatedLogs?.length ?? 0,
    });
    report.backfilledLogs += updatedLogs?.length ?? 0;
  }

  await writeFile(
    new URL('./migration-report.json', import.meta.url),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
