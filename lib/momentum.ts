import { CategoryType } from './types';
import { getAccessoryFileName } from './accessoires';

export const MOMENTUM_ALPHA = 0.3;

export type MomentumTrend = 'up' | 'down' | 'stable';

export interface AccessoryDisplayState {
  tier: number;
  svgFileName: string;
  overlayHeight: number;
  overlayColor: string;
}

/**
 * Exponential Moving Average update.
 * new = alpha * todayScore + (1 - alpha) * previous
 */
export function applyEMA(previous: number, todayScore: number, alpha: number = MOMENTUM_ALPHA): number {
  return alpha * todayScore + (1 - alpha) * previous;
}

/**
 * Standard decay for absent days.
 * result = momentum * (1 - alpha)^daysAbsent
 */
export function applyDecay(momentum: number, daysAbsent: number, alpha: number = MOMENTUM_ALPHA): number {
  return momentum * Math.pow(1 - alpha, daysAbsent);
}

/**
 * Accelerated decay (e.g. for streaks broken over threshold).
 * result = max(0, momentum * (1 - alpha*2)^daysOverThreshold)
 */
export function applyAcceleratedDecay(momentum: number, daysOverThreshold: number, alpha: number = MOMENTUM_ALPHA): number {
  return Math.max(0, momentum * Math.pow(1 - alpha * 2, daysOverThreshold));
}

/**
 * Determine the display tier from momentum [0..100].
 * ≤20 → 0, ≤40 → 1, ≤60 → 2, ≤80 → 3, else → 4
 */
export function determineTier(momentum: number): number {
  if (momentum <= 20) return 0;
  if (momentum <= 40) return 1;
  if (momentum <= 60) return 2;
  if (momentum <= 80) return 3;
  return 4;
}

/**
 * Height of the overlay mask (0% momentum → 100 height, 100% → 0 height).
 */
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

/**
 * Full accessory display state for a given category, momentum and trend.
 * Momentum is clamped to [0, 100].
 */
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
 * 2. Apply EMA(base, todayScore) to get updated.
 * 3. Round to 1 decimal, clamp to [0, 100].
 * 4. Determine trend compared to previous.
 */
export function computeUpdatedMomentum(
  previous: number,
  todayScore: number,
  daysAbsent: number,
): { momentum: number; trend: MomentumTrend } {
  const base = daysAbsent > 0 ? applyDecay(previous, daysAbsent) : previous;
  const updated = applyEMA(base, todayScore);
  const rounded = Math.min(100, Math.max(0, Math.round(updated * 10) / 10));

  let trend: MomentumTrend;
  if (rounded > previous + 1) {
    trend = 'up';
  } else if (rounded < previous - 1) {
    trend = 'down';
  } else {
    trend = 'stable';
  }

  return { momentum: rounded, trend };
}
