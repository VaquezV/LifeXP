import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface HabitToMigrate {
  id: string;
  name: string;
  category: string;
  frequency_type: string;
  frequency_value: number;
  min_value: number;
  target_value: number;
  max_value: number | null;
}

interface PresetHabit {
  id: string;
  name: string;
  category: string;
  expertise: string;
  frequency_type: string;
  frequency_value: number;
  min_value: number;
  target_value: number;
  max_value: number;
}

interface MigrationReport {
  totalHabits: number;
  autoLinked: Array<{ habitId: string; habitName: string; presetId: string; presetName: string; expertise: string }>;
  unmatched: Array<{ habitId: string; habitName: string; category: string; parameters: string }>;
  ambiguous: Array<{ habitId: string; habitName: string; candidates: Array<{ presetId: string; presetName: string; expertise: string }> }>;
  backfilledLogs: number;
  errors: Array<{ habitId: string; error: string }>;
}

const DRY_RUN = process.env.DRY_RUN === 'true';

if (DRY_RUN) {
  console.log('⚠️  DRY RUN MODE - No data will be modified\n');
}

const PARAM_TOLERANCE = 0.05; // 5% tolerance

// Manual name mappings for habits that don't match preset names exactly
const NAME_MAPPING: Record<string, string> = {
  'Violon': 'Musique',
  'Femme': 'Massage Partenaire',
};

function isParameterMatch(habitValue: number | null, presetValue: number, allowNull: boolean = false): boolean {
  if (habitValue === null) return allowNull;
  if (presetValue === 0) return habitValue === 0;
  const tolerance = Math.abs(presetValue * PARAM_TOLERANCE);
  return Math.abs(habitValue - presetValue) <= tolerance;
}

function findPresetMatch(habit: HabitToMigrate, presets: PresetHabit[]): PresetHabit | PresetHabit[] | null {
  const usedNameMapping = NAME_MAPPING[habit.name] !== undefined;
  const habitName = NAME_MAPPING[habit.name] || habit.name;

  const candidates = presets.filter(
    p => p.name.toLowerCase() === habitName.toLowerCase() && p.category === habit.category
  );

  if (candidates.length === 0) return null;

  // Try exact matches (all parameters including max_value)
  const exactMatches = candidates.filter(
    c =>
      c.frequency_type === habit.frequency_type &&
      c.frequency_value === habit.frequency_value &&
      isParameterMatch(habit.min_value, c.min_value) &&
      isParameterMatch(habit.target_value, c.target_value) &&
      isParameterMatch(habit.max_value, c.max_value, true)
  );

  if (exactMatches.length === 1) return exactMatches[0];
  if (exactMatches.length > 1) return exactMatches;

  // If no exact match and max_value is NULL, try matching without max_value constraint
  if (habit.max_value === null) {
    const partialMatches = candidates.filter(
      c =>
        c.frequency_type === habit.frequency_type &&
        c.frequency_value === habit.frequency_value &&
        isParameterMatch(habit.target_value, c.target_value) // Target is the most important
    );

    // If using name mapping, be more lenient: match by target alone and frequency
    if (usedNameMapping && partialMatches.length > 0) {
      // Pick the best match: prefer exact target, then lower min
      const best = partialMatches.sort((a, b) => {
        const aTargetDiff = Math.abs(a.target_value - (habit.target_value || 0));
        const bTargetDiff = Math.abs(b.target_value - (habit.target_value || 0));
        return aTargetDiff - bTargetDiff;
      })[0];
      return best;
    }

    if (partialMatches.length === 1) return partialMatches[0];
    if (partialMatches.length > 1) return partialMatches;
  }

  return null;
}

async function fetchAllHabits(): Promise<HabitToMigrate[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('id, name, category, frequency_type, frequency_value, min_value, target_value, max_value')
    .order('category')
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch habits: ${error.message}`);
  }

  return data || [];
}

async function fetchAllPresets(): Promise<PresetHabit[]> {
  const { data, error } = await supabase
    .from('preset_habits')
    .select('id, name, category, expertise, frequency_type, frequency_value, min_value, target_value, max_value')
    .order('name')
    .order('expertise');

  if (error) {
    throw new Error(`Failed to fetch presets: ${error.message}`);
  }

  return data || [];
}

async function linkHabitToPreset(habitId: string, presetId: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ preset_habit_id: presetId })
    .eq('id', habitId);

  if (error) {
    throw new Error(`Failed to link habit ${habitId}: ${error.message}`);
  }
}

async function backfillHabitLogs(habitId: string, presetId: string): Promise<number> {
  const { error, data } = await supabase
    .from('habit_logs')
    .update({ preset_habit_id: presetId })
    .eq('habit_id', habitId)
    .select('id');

  if (error) {
    throw new Error(`Failed to backfill logs for habit ${habitId}: ${error.message}`);
  }

  return (data || []).length;
}

async function main() {
  console.log('Starting migration: link existing habits to presets...\n');

  const report: MigrationReport = {
    totalHabits: 0,
    autoLinked: [],
    unmatched: [],
    ambiguous: [],
    backfilledLogs: 0,
    errors: [],
  };

  try {
    const habits = await fetchAllHabits();
    const presets = await fetchAllPresets();

    console.log(`Loaded ${habits.length} habits and ${presets.length} presets\n`);
    report.totalHabits = habits.length;

    for (const habit of habits) {
      const match = findPresetMatch(habit, presets);
      const mappedName = NAME_MAPPING[habit.name] || habit.name;

      if (match === null) {
        report.unmatched.push({
          habitId: habit.id,
          habitName: habit.name,
          category: habit.category,
          parameters: `min=${habit.min_value}, target=${habit.target_value}, max=${habit.max_value}`,
        });
      } else if (Array.isArray(match)) {
        report.ambiguous.push({
          habitId: habit.id,
          habitName: habit.name,
          candidates: match.map(m => ({ presetId: m.id, presetName: m.name, expertise: m.expertise })),
        });
      } else {
        report.autoLinked.push({
          habitId: habit.id,
          habitName: habit.name,
          presetId: match.id,
          presetName: match.name,
          expertise: match.expertise,
        });

        // Link habit to preset and backfill logs
        if (!DRY_RUN) {
          try {
            await linkHabitToPreset(habit.id, match.id);
            const backfilledCount = await backfillHabitLogs(habit.id, match.id);
            report.backfilledLogs += backfilledCount;
            console.log(`✓ Linked ${habit.name} → ${match.name} (${match.expertise}), backfilled ${backfilledCount} logs`);
          } catch (error) {
            report.errors.push({
              habitId: habit.id,
              error: error instanceof Error ? error.message : String(error),
            });
            console.error(`✗ Error linking ${habit.name}:`, error);
          }
        }
      }
    }

    console.log(`Matching complete:`);
    console.log(`  Auto-linked: ${report.autoLinked.length}`);
    console.log(`  Unmatched: ${report.unmatched.length}`);
    console.log(`  Ambiguous: ${report.ambiguous.length}\n`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  // Save report
  fs.writeFileSync('scripts/migration-report.json', JSON.stringify(report, null, 2));
  console.log('\nMigration report saved to scripts/migration-report.json');
  console.log(`Summary: ${report.autoLinked.length} auto-linked, ${report.unmatched.length} unmatched, ${report.ambiguous.length} ambiguous`);
}

main();
