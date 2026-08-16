import { applyDailyNet, targetConfigLevel, LevelConfig } from './level-decay';

const CONFIGS: LevelConfig[] = [
  { level: 1, daily_maintenance: 1.5, points_to_next_level: 50 },
  { level: 2, daily_maintenance: 2.5, points_to_next_level: 65 },
  { level: 3, daily_maintenance: 4.0, points_to_next_level: 85 },
  { level: 4, daily_maintenance: 6.5, points_to_next_level: 110 },
  { level: 5, daily_maintenance: 10.0, points_to_next_level: 140 },
];

function getConfig(level: number): LevelConfig | undefined {
  return CONFIGS.find(c => c.level === level);
}

describe('targetConfigLevel', () => {
  it('points to the next level for levels 0-4', () => {
    expect(targetConfigLevel(0)).toBe(1);
    expect(targetConfigLevel(4)).toBe(5);
  });

  it('clamps to 5 for the max level', () => {
    expect(targetConfigLevel(5)).toBe(5);
  });
});

describe('applyDailyNet', () => {
  it('accumulates net points without changing level when below threshold', () => {
    const result = applyDailyNet({ currentLevel: 1, pointsInLevel: 10 }, 5, getConfig);
    // config for level 1 is targetConfigLevel(1)=2 -> daily_maintenance 2.5
    expect(result).toEqual({ currentLevel: 1, pointsInLevel: 12.5 });
  });

  it('levels up and carries the remainder when points cross the threshold', () => {
    const result = applyDailyNet({ currentLevel: 0, pointsInLevel: 48 }, 5, getConfig);
    // config for level 0 is targetConfigLevel(0)=1 -> maintenance 1.5, points_to_next_level 50
    // net = 5 - 1.5 = 3.5 -> 48 + 3.5 = 51.5 >= 50 -> level 1, remainder 1.5
    expect(result).toEqual({ currentLevel: 1, pointsInLevel: 1.5 });
  });

  it('resets points to 0 exactly when reaching level 5', () => {
    const result = applyDailyNet({ currentLevel: 4, pointsInLevel: 105 }, 10, getConfig);
    // config for level 4 is targetConfigLevel(4)=5 -> maintenance 10.0, points_to_next_level 140
    // net = 10 - 10 = 0 -> 105 + 0 = 105 < 140, stays level 4
    expect(result).toEqual({ currentLevel: 4, pointsInLevel: 105 });
  });

  it('drops one level and sets points to 75% of the lower level cap when points go negative', () => {
    const result = applyDailyNet({ currentLevel: 4, pointsInLevel: 5 }, 0, getConfig);
    // config for level 4 is targetConfigLevel(4)=5 -> maintenance 10.0
    // net = 0 - 10 = -10 -> 5 - 10 = -5 < 0 -> drop to level 3
    // cap of level 3 = targetConfigLevel(3)=4 -> points_to_next_level 110 -> 75% = 82.5 -> round 83
    expect(result).toEqual({ currentLevel: 3, pointsInLevel: 83 });
  });

  it('floors at level 0 with 0 points when already at the bottom and points go negative', () => {
    const result = applyDailyNet({ currentLevel: 0, pointsInLevel: 1 }, 0, getConfig);
    // config for level 0 is targetConfigLevel(0)=1 -> maintenance 1.5
    // net = 0 - 1.5 = -1.5 -> 1 - 1.5 = -0.5 < 0 but currentLevel is already 0 -> floor at 0
    expect(result).toEqual({ currentLevel: 0, pointsInLevel: 0 });
  });

  it('can decay from the max level 5 back down to level 4', () => {
    const result = applyDailyNet({ currentLevel: 5, pointsInLevel: 5 }, 0, getConfig);
    // config for level 5 reuses targetConfigLevel(5)=5 -> maintenance 10.0
    // net = 0 - 10 = -10 -> 5 - 10 = -5 < 0 -> drop to level 4
    // cap of level 4 = targetConfigLevel(4)=5 -> points_to_next_level 140 -> 75% = 105
    expect(result).toEqual({ currentLevel: 4, pointsInLevel: 105 });
  });

  it('accumulates unbounded points at the max level without leveling up further', () => {
    const result = applyDailyNet({ currentLevel: 5, pointsInLevel: 150 }, 20, getConfig);
    // net = 20 - 10 = 10 -> 150 + 10 = 160, currentLevel already 5 so no further level-up
    expect(result).toEqual({ currentLevel: 5, pointsInLevel: 160 });
  });

  it('returns the state unchanged when no config exists for the target level', () => {
    const result = applyDailyNet({ currentLevel: 99, pointsInLevel: 10 }, 5, () => undefined);
    expect(result).toEqual({ currentLevel: 99, pointsInLevel: 10 });
  });
});
