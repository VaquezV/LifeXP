export interface LevelConfig {
  level: number;
  daily_maintenance: number;
  points_to_next_level: number;
}

export interface LevelState {
  currentLevel: number;
  pointsInLevel: number;
}

/** The scoring_config row that governs maintenance/thresholds while sitting at `level`: the next level's row, clamped to 5 since there is no row 6 to represent max-level upkeep. */
export function targetConfigLevel(level: number): number {
  return Math.min(level + 1, 5);
}

/** Applies one day of net scoring to a category, levelling up on a full threshold and levelling down (to 75% of the lower level's cap) when points go negative. Called by apply-daily-scoring for each user/category. */
export function applyDailyNet(
  state: LevelState,
  ptsToday: number,
  getConfig: (level: number) => LevelConfig | undefined
): LevelState {
  const config = getConfig(targetConfigLevel(state.currentLevel));
  if (!config) return state;

  const net = ptsToday - config.daily_maintenance;
  let pointsInLevel = state.pointsInLevel + net;
  let newLevel = state.currentLevel;

  if (pointsInLevel < 0 && state.currentLevel > 0) {
    newLevel = state.currentLevel - 1;
    const capConfig = getConfig(targetConfigLevel(newLevel));
    pointsInLevel = Math.round(0.75 * (capConfig?.points_to_next_level ?? 0));
  } else {
    pointsInLevel = Math.max(0, pointsInLevel);
    if (pointsInLevel >= config.points_to_next_level && state.currentLevel < 5) {
      pointsInLevel -= config.points_to_next_level;
      newLevel = state.currentLevel + 1;
      if (newLevel >= 5) pointsInLevel = 0;
    }
  }

  return { currentLevel: newLevel, pointsInLevel };
}
