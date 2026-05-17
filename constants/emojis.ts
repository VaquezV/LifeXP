// Emotional states based on completion score
export const EMOTIONAL_EMOJIS = {
  exhausted: '😴', // 0-20%
  sad: '😔', // 20-40%
  neutral: '😐', // 40-60%
  content: '🙂', // 60-80%
  happy: '😄', // 80-95%
  epic: '🤩', // 95-100%
} as const;

// Get emoji by score percentage
export function getEmotionalEmoji(score: number): string {
  if (score < 20) return EMOTIONAL_EMOJIS.exhausted;
  if (score < 40) return EMOTIONAL_EMOJIS.sad;
  if (score < 60) return EMOTIONAL_EMOJIS.neutral;
  if (score < 80) return EMOTIONAL_EMOJIS.content;
  if (score < 95) return EMOTIONAL_EMOJIS.happy;
  return EMOTIONAL_EMOJIS.epic;
}

// Category emojis
export const CATEGORY_EMOJIS = {
  self_care: '🧘',
  dev_perso: '🚀',
  vie_familiale: '👨‍👩‍👧‍👦',
  vie_pro: '💼',
} as const;

// Status emojis
export const STATUS_EMOJIS = {
  success: '✅',
  pending: '⏳',
  failed: '❌',
  locked: '🔒',
  new: '✨',
} as const;

// Habit completion indicators
export const COMPLETION_EMOJIS = {
  empty: '⬜',
  partial: '🟨',
  full: '🟩',
} as const;

// Frequency indicators
export const FREQUENCY_EMOJIS = {
  per_day: '📅',
  times_per_day: '🔄',
  times_per_week: '📆',
  per_week: '🗓️',
} as const;
