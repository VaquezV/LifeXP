import { CategoryType } from './types';
import { getAccessoryFileName } from './accessoires';

/** Map a 0-100 momentum score to a tier index (0-4). */
function getAccessoryTierIndex(pct: number): 0 | 1 | 2 | 3 | 4 {
  if (pct <= 20) return 0;
  if (pct <= 40) return 1;
  if (pct <= 60) return 2;
  if (pct <= 80) return 3;
  return 4;
}

/** Return the filename for the next tier above the current score (clamped at tier 4). */
function getNextTierFileName(category: CategoryType, score: number): string {
  const currentTier = getAccessoryTierIndex(score);
  // Convert to 1-5 level for getAccessoryFileName: tier 0 → level 1 … tier 4 → level 5
  // Next tier: min(currentTier + 1, 4), then level = nextTier + 1
  const nextTier = Math.min(currentTier + 1, 4);
  const level = nextTier + 1;
  return getAccessoryFileName(category, level);
}

export const MOMENTUM_ALPHA = 0.3;

export type MomentumTrend = 'up' | 'down' | 'stable';

export interface AccessoryDisplayState {
  tier: number;
  svgFileName: string;
  overlayHeight: number;
  overlayColor: string;
}

export function applyEMA(previous: number, todayScore: number, alpha: number = MOMENTUM_ALPHA): number {
  return alpha * todayScore + (1 - alpha) * previous;
}

export function applyDecay(momentum: number, daysAbsent: number, alpha: number = MOMENTUM_ALPHA): number {
  return momentum * Math.pow(1 - alpha, daysAbsent);
}

export function applyAcceleratedDecay(momentum: number, daysOverThreshold: number, alpha: number = MOMENTUM_ALPHA): number {
  return Math.max(0, momentum * Math.pow(1 - alpha * 2, daysOverThreshold));
}

export function determineTier(momentum: number): number {
  return getAccessoryTierIndex(momentum);
}

export function getOverlayHeight(momentum: number): number {
  return Math.round(100 * (1 - momentum / 100));
}

// Red when declining and score is critically low (< 25%).
export function getOverlayColor(score: number, trend: MomentumTrend): string {
  if (trend === 'down' && score < 25) return 'rgba(255, 0, 0, 0.6)';
  return 'rgba(128, 128, 128, 0.6)';
}

export function getAccessoryDisplayState(
  category: CategoryType,
  score: number,   // completionPct (weekly score), 0-100
  trend: MomentumTrend,
): AccessoryDisplayState {
  const s = Math.min(100, Math.max(0, score));
  return {
    tier:          determineTier(s),
    svgFileName:   getNextTierFileName(category, s),
    overlayHeight: getOverlayHeight(s),
    overlayColor:  getOverlayColor(s, trend),
  };
}

/**
 * Compute the updated momentum value and its trend direction.
 *
 * 1. If daysAbsent > 0, apply decay to previous to get base.
 *    Special case: score=0 AND daysAbsent>3 → normal decay for first 3 days,
 *    then accelerated decay (2× rate) for each day beyond day 3.
 * 2. Apply EMA(base, todayScore) to get updated.
 * 3. Round to 1 decimal, clamp to [0, 100].
 * 4. Determine trend with a ±1 dead-band around previous to avoid noise.
 */
export function computeUpdatedMomentum(
  previous: number,
  todayScore: number,
  daysAbsent: number,
): { momentum: number; trend: MomentumTrend } {
  let base = previous;

  if (daysAbsent > 0) {
    if (todayScore === 0 && daysAbsent > 3) {
      // Normal decay for first 3 days, accelerated for days beyond day 3
      const normalDays = 3;
      const extraDays = daysAbsent - 3;
      base = applyDecay(previous, normalDays);
      base = applyAcceleratedDecay(base, extraDays);
    } else {
      base = applyDecay(previous, daysAbsent);
    }
  }

  const updated = applyEMA(base, todayScore);
  const rounded = Math.max(0, Math.min(100, Math.round(updated * 10) / 10));
  const trend: MomentumTrend =
    rounded > previous + 1 ? 'up' :
    rounded < previous - 1 ? 'down' :
    'stable';
  return { momentum: rounded, trend };
}
