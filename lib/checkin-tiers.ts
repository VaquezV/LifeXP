import type { FrequencyType } from './types';

type TieredHabit = {
  frequency_type: FrequencyType;
  target_value: number;
  min_value: number;
};

const NICE_MULTIPLES = [1, 2, 5, 10];

/** Rounds x to the nearest {1,2,5}×10ⁿ value, used to derive dropdown steps for unit_per_day/unit_per_week. */
export function niceStep(x: number): number {
  if (x <= 1) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(x)));
  const candidates = NICE_MULTIPLES.map((m) => m * magnitude);
  return candidates.reduce((closest, c) => (Math.abs(c - x) < Math.abs(closest - x) ? c : closest));
}

function legacyStepSize(targetValue: number, minValue: number): number {
  const range = targetValue - minValue;
  if (range < 30) return 5;
  if (range < 60) return 15;
  if (range < 300) return 30;
  return 60;
}

function buildSteppedRange(start: number, end: number, step: number): number[] {
  const values: number[] = [];
  for (let i = start; i <= end; i += step) values.push(i);
  if (values[values.length - 1] !== end) values.push(end);
  return values;
}

function buildNiceTiers(min: number, cap: number): number[] {
  const step = niceStep((cap - min) / 6);
  const values = new Set<number>();
  for (let i = 0; i <= 5; i++) {
    const v = min + i * step;
    if (v >= cap) break;
    values.add(v);
  }
  values.add(min);
  values.add(cap);
  return Array.from(values).sort((a, b) => a - b);
}

/** Builds the list of values offered in the checkin dropdown for a given habit's goal type. */
export function getAvailableTiers(habit: TieredHabit): number[] {
  const { frequency_type, target_value, min_value } = habit;

  if (frequency_type === 'times_per_week') {
    return [0, 1];
  }
  if (frequency_type === 'times_per_day') {
    return Array.from({ length: target_value + 1 }, (_, i) => i);
  }
  if (frequency_type === 'duration_per_week') {
    return buildSteppedRange(0, target_value, legacyStepSize(target_value, 0));
  }
  if (frequency_type === 'unit_per_day') {
    return buildNiceTiers(min_value, target_value);
  }
  if (frequency_type === 'unit_per_week') {
    const cap = (target_value / 7) * 1.5;
    return buildNiceTiers(min_value, cap);
  }
  // per_day
  return buildSteppedRange(min_value, target_value, legacyStepSize(target_value, min_value));
}

/** Formats a checkin value for display (minutes → "1h30", unit types → "10000 pas"). */
export function formatCheckinValue(habit: { frequency_type: FrequencyType; unit_label?: string | null }, v: number): string {
  const { frequency_type, unit_label } = habit;

  if (frequency_type === 'per_day' || frequency_type === 'duration_per_week') {
    if (v < 60) return `${v}m`;
    const hours = Math.floor(v / 60);
    const mins = v % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  }
  if (frequency_type === 'unit_per_day' || frequency_type === 'unit_per_week') {
    return unit_label ? `${v} ${unit_label}` : `${v}`;
  }
  return `${v}`;
}
