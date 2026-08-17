// supabase/functions/compute-avatar-level/index.ts
// Single source of truth for the avatar/wolf level: computes it from
// category_progress and persists it to user_palette_progression. The app
// must stop recomputing this client-side and just call this function.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CATEGORIES = ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const;
type Category = (typeof CATEGORIES)[number];
type Levels = Record<Category, number>;

const SCORE_THRESHOLDS = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95] as const;

function countAtLeast(levels: Levels, minLevel: number): number {
  return Object.values(levels).filter(l => l >= minLevel).length;
}

// Mirrors lib/avatar-level.ts#getAvatarScoreFromLevels — keep in sync.
function computeAvatarScore(levels: Levels): number {
  const lvl1 = countAtLeast(levels, 1);
  const lvl2 = countAtLeast(levels, 2);
  const lvl3 = countAtLeast(levels, 3);
  const lvl4 = countAtLeast(levels, 4);
  const lvl5 = countAtLeast(levels, 5);

  if (lvl5 >= 4) return 95;
  if (lvl4 >= 4) return 85;
  if (lvl4 >= 2 && lvl3 >= 4) return 75;
  if (lvl3 >= 4) return 65;
  if (lvl3 >= 2 && lvl2 >= 4) return 55;
  if (lvl2 >= 4) return 45;
  if (lvl2 >= 2 && lvl1 >= 4) return 35;
  if (lvl1 >= 4) return 25;
  if (lvl1 >= 2) return 15;
  return 5;
}

function getWolfTierIndex(score: number): number {
  const idx = SCORE_THRESHOLDS.findIndex(t => score <= t);
  return idx >= 0 ? idx : SCORE_THRESHOLDS.length - 1;
}

Deno.serve(async req => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  }

  const { data: rows, error: progressError } = await client
    .from('category_progress')
    .select('category, current_level')
    .eq('user_id', user.id);
  if (progressError) {
    return new Response(JSON.stringify({ error: progressError.message }), { status: 500 });
  }

  const levels = Object.fromEntries(CATEGORIES.map(c => [c, 0])) as Levels;
  for (const row of rows ?? []) {
    if ((CATEGORIES as readonly string[]).includes(row.category)) {
      levels[row.category as Category] = row.current_level;
    }
  }

  const avatarScore = computeAvatarScore(levels);
  const tierIndex = getWolfTierIndex(avatarScore);
  const wolfLevel = tierIndex + 1;

  const { error: upsertError } = await client
    .from('user_palette_progression')
    .upsert(
      { user_id: user.id, current_wolf_level: wolfLevel },
      { onConflict: 'user_id' },
    );
  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ avatarScore, wolfLevel, tierIndex, levels }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
