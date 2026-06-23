import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALPHA = 0.3;

function applyEMA(previous: number, todayScore: number): number {
  return ALPHA * todayScore + (1 - ALPHA) * previous;
}

function applyDecay(momentum: number, days: number): number {
  return momentum * Math.pow(1 - ALPHA, days);
}

function calcCategoryScore(
  habits: any[],
  weekLogs: Record<string, Record<string, number>>,
): number {
  const dates = Object.keys(weekLogs).sort();
  if (habits.length === 0 || dates.length === 0) return 0;

  const completions: number[] = [];
  for (const h of habits) {
    if (h.frequency_type === 'times_per_week') {
      const total = dates.reduce((s: number, d: string) => s + (weekLogs[d]?.[h.id] ?? 0), 0);
      completions.push(
        h.target_value === 0 ? 0 : Math.min(100, Math.round((total / h.target_value) * 100)),
      );
    } else {
      const dayScores: number[] = [];
      for (const date of dates) {
        const v = weekLogs[date]?.[h.id] ?? 0;
        let pct = 0;
        if (h.frequency_type === 'per_day') {
          if (v < h.min_value) pct = 0;
          else if (v >= h.target_value) pct = 100;
          else {
            const range = h.target_value - h.min_value;
            pct = range === 0 ? 100 : Math.round(((v - h.min_value) / range) * 100);
          }
        } else { // times_per_day
          pct = h.target_value === 0
            ? 0
            : Math.max(0, Math.min(100, Math.round((v / h.target_value) * 100)));
        }
        dayScores.push(pct);
      }
      completions.push(Math.round(dayScores.reduce((s, p) => s + p, 0) / dayScores.length));
    }
  }
  return Math.round(completions.reduce((s, p) => s + p, 0) / completions.length);
}

function determineTrend(next: number, prev: number): 'up' | 'down' | 'stable' {
  if (next > prev + 1) return 'up';
  if (next < prev - 1) return 'down';
  return 'stable';
}

Deno.serve(async (req: Request) => {
  // Auth check
  const secret = req.headers.get('x-cron-secret');
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400_000).toISOString().split('T')[0];

  // Get distinct user IDs from habits table
  const { data: rows } = await client.from('habits').select('user_id');
  const userIds = [...new Set((rows ?? []).map((r: any) => r.user_id as string))];

  const CATEGORIES = [
    { key: 'self_care',     col: 'momentum_selfcare', trendCol: 'trend_selfcare' },
    { key: 'dev_perso',     col: 'momentum_devperso', trendCol: 'trend_devperso' },
    { key: 'vie_familiale', col: 'momentum_famille',  trendCol: 'trend_famille'  },
    { key: 'vie_pro',       col: 'momentum_pro',      trendCol: 'trend_pro'      },
  ];

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

    const { data: existing } = await client
      .from('category_momentum')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const lastUpdated: string = existing?.last_updated ?? today;
    const daysAbsent = Math.max(
      0,
      Math.floor(
        (new Date(today).getTime() - new Date(lastUpdated).getTime()) / 86400_000
      ) - 1,
    );

    const upsertData: Record<string, any> = { user_id: userId, last_updated: today };

    for (const { key, col, trendCol } of CATEGORIES) {
      const catHabits = habits.filter((h: any) => h.category === key);
      const todayScore = calcCategoryScore(catHabits, weekLogs);
      const prev: number = (existing?.[col] ?? 0) as number;

      let decayed = prev;
      if (daysAbsent > 0) {
        if (todayScore === 0 && daysAbsent > 3) {
          // Normal decay for 3 days, accelerated beyond that
          decayed = applyDecay(prev, 3);
          decayed = Math.max(0, decayed * Math.pow(1 - ALPHA * 2, daysAbsent - 3));
        } else {
          decayed = applyDecay(prev, daysAbsent);
        }
      }

      const next = Math.max(0, Math.min(100, Math.round(applyEMA(decayed, todayScore) * 10) / 10));
      upsertData[col] = next;
      upsertData[trendCol] = determineTrend(next, prev);
    }

    await client
      .from('category_momentum')
      .upsert(upsertData, { onConflict: 'user_id' });
    updated++;
  }

  return new Response(JSON.stringify({ updated, date: today }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
