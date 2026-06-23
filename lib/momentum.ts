import { CategoryType } from './types';
import { getAccessoryFileName, getAccessoryTierIndex } from './accessoires';

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

/**
 * Overlay color: red when trend is 'down' AND momentum % 20 < 10, otherwise grey.
 */
export function getOverlayColor(momentum: number, trend: MomentumTrend): string {
  if (trend === 'down' && momentum % 20 < 10) {
    return 'rgba(255, 0, 0, 0.6)';
  }
  return 'rgba(128, 128, 128, 0.6)';
}

export function getAccessoryDisplayState(
  category: CategoryType,
  momentum: number,
  trend: MomentumTrend,
): AccessoryDisplayState {
  const m = Math.min(100, Math.max(0, momentum));
  return {
    tier: determineTier(m),
    svgFileName: getAccessoryFileName(category, m),
    overlayHeight: getOverlayHeight(m),
    overlayColor: getOverlayColor(m, trend),
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
