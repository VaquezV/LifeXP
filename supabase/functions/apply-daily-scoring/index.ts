// supabase/functions/apply-daily-scoring/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PtsScaleEntry { pct: number; pts: number; }
interface ScoringConfig {
  level: number;
  max_habits: number;
  min_completion_pct: number;
  pts_scale: PtsScaleEntry[];
  daily_maintenance: number;
  points_to_next_level: number;
}

function applyPtsScale(scale: PtsScaleEntry[], completionPct: number): number {
  let result = 0;
  for (const entry of scale) {
    if (completionPct >= entry.pct) result = entry.pts;
  }
  return result;
}

function calcHabitCompletionPct(habit: any, weekLogs: Record<string, Record<string, number>>): number {
  const dates = Object.keys(weekLogs).sort();
  if (dates.length === 0) return 0;

  if (habit.frequency_type === 'times_per_week') {
    const total = dates.reduce((s: number, d: string) => s + (weekLogs[d]?.[habit.id] ?? 0), 0);
    return habit.target_value === 0 ? 0 : Math.min(100, Math.round((total / habit.target_value) * 100));
  }

  const dayScores: number[] = [];
  for (const date of dates) {
    const v = weekLogs[date]?.[habit.id] ?? 0;
    let pct = 0;
    if (habit.frequency_type === 'per_day') {
      if (v < habit.min_value) pct = 0;
      else if (v >= habit.target_value) pct = 100;
      else {
        const range = habit.target_value - habit.min_value;
        pct = range === 0 ? 100 : Math.round(((v - habit.min_value) / range) * 100);
      }
    } else {
      pct = habit.target_value === 0 ? 0 : Math.max(0, Math.min(100, Math.round((v / habit.target_value) * 100)));
    }
    dayScores.push(pct);
  }
  return Math.round(dayScores.reduce((s, p) => s + p, 0) / dayScores.length);
}

const CATEGORIES = ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const;

Deno.serve(async (req: Request) => {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 6 * 86_400_000).toISOString().split('T')[0];

  const { data: configRows, error: configErr } = await client.from('scoring_config').select('*');
  if (configErr) return new Response('Config load failed', { status: 500 });
  const configs: Record<number, ScoringConfig> = {};
  for (const row of configRows ?? []) configs[row.level] = row as ScoringConfig;

  const { data: habitRows } = await client.from('habits').select('user_id');
  const userIds = [...new Set((habitRows ?? []).map((r: any) => r.user_id as string))];

  let updated = 0;

  for (const userId of userIds) {
    const { data: habits } = await client.from('habits').select('*').eq('user_id', userId);
    if (!habits?.length) continue;

    const { data: logs } = await client
      .from('habit_logs')
      .select('date, habit_id, value')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .lte('date', today);

    const weekLogs: Record<string, Record<string, number>> = {};
    for (const log of logs ?? []) {
      if (!weekLogs[log.date]) weekLogs[log.date] = {};
      weekLogs[log.date][log.habit_id] = log.value;
    }

    const { data: progressRows } = await client
      .from('category_progress')
      .select('*')
      .eq('user_id', userId);

    const existingProgress: Record<string, any> = {};
    for (const row of progressRows ?? []) existingProgress[row.category] = row;

    for (const category of CATEGORIES) {
      const existing = existingProgress[category];

      if (existing?.last_maintenance_date === today) continue;

      const currentLevel: number = existing?.current_level ?? 1;
      let pointsInLevel: number = existing?.points_in_level ?? 0;

      const config: ScoringConfig = configs[currentLevel];
      if (!config) continue;

      const catHabits = habits.filter((h: any) => h.category === category);
      let ptsToday = 0;
      for (const habit of catHabits) {
        const completionPct = calcHabitCompletionPct(habit, weekLogs);
        ptsToday += applyPtsScale(config.pts_scale, completionPct);
      }

      const net = ptsToday - config.daily_maintenance;
      pointsInLevel = Math.max(0, pointsInLevel + net);

      let newLevel = currentLevel;
      if (pointsInLevel >= config.points_to_next_level && currentLevel < 5) {
        pointsInLevel -= config.points_to_next_level;
        newLevel = currentLevel + 1;
      }

      await client.from('category_progress').upsert(
        {
          user_id: userId,
          category,
          current_level: newLevel,
          points_in_level: pointsInLevel,
          last_maintenance_date: today,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category' },
      );
    }
    updated++;
  }

  return new Response(JSON.stringify({ updated, date: today }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
