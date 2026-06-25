import type { ScoringConfig } from './types';

export const SCORING_CONFIG_FALLBACK: ScoringConfig[] = [
  { level: 1, min_completion_pct: 80, daily_maintenance: 1.5, points_to_next_level: 50,
    pts_scale: [{pct:80,pts:1},{pct:85,pts:2},{pct:90,pts:3},{pct:95,pts:4},{pct:100,pts:5}] },
  { level: 2, min_completion_pct: 82, daily_maintenance: 2.5, points_to_next_level: 65,
    pts_scale: [{pct:82,pts:1},{pct:87,pts:2},{pct:92,pts:3},{pct:97,pts:4},{pct:100,pts:5}] },
  { level: 3, min_completion_pct: 84, daily_maintenance: 4.0, points_to_next_level: 85,
    pts_scale: [{pct:84,pts:1},{pct:89,pts:2},{pct:94,pts:3},{pct:99,pts:4},{pct:100,pts:5}] },
  { level: 4, min_completion_pct: 86, daily_maintenance: 6.5, points_to_next_level: 110,
    pts_scale: [{pct:86,pts:1},{pct:91,pts:2},{pct:96,pts:3},{pct:99,pts:4},{pct:100,pts:5}] },
  { level: 5, min_completion_pct: 95, daily_maintenance: 10.0, points_to_next_level: 140,
    pts_scale: [{pct:95,pts:1},{pct:97,pts:3},{pct:99,pts:4},{pct:100,pts:5}] },
];
