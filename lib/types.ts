export type CategoryType = 'self_care' | 'dev_perso' | 'vie_familiale' | 'vie_pro';
export type FrequencyType = 'per_day' | 'times_per_day' | 'times_per_week';

export interface Habit {
  id: string;
  user_id: string;
  category: CategoryType;
  name: string;
  description?: string | null;
  emoji: string;
  frequency_type: FrequencyType;
  frequency_value: number;
  min_value: number;
  target_value: number;
  max_value: number | null;
  preset_habit_id: string | null;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  preset_habit_id: string | null;
  date: string; // YYYY-MM-DD
  value: number;
  created_at: string;
}

export interface DayCompletion {
  date: string;
  percentage: number;
  category: CategoryType;
}

export interface WeeklyHabitScore {
  habit_id: string;
  percentage: number;
}

export interface HabitWithLogs extends Habit {
  logs: Record<string, number>; // date -> value
}

export interface PresetHabit {
  id: string;
  name: string;
  category: CategoryType;
  expertise: 'debutant' | 'intermediaire' | 'expert' | 'enfant' | 'ado' | 'adulte_homme' | 'adulte_femme' | 'standard';
  emoji: string;
  frequency_type: FrequencyType;
  frequency_value: number;
  min_value: number;
  target_value: number;
  max_value: number;
  editable_min_value: boolean;
  editable_target_value: boolean;
  editable_max_value: boolean;
  editable_frequency_type: boolean;
  editable_frequency_value: boolean;
  created_at: string;
}

export interface PresetBadge {
  id: string;
  preset_habit_id: string;
  badge_level: number;
  consecutive_days: number;
  badge_name: string | null;
  badge_emoji: string | null;
  created_at: string;
}

export interface PresetHabitWithBadges extends PresetHabit {
  badges: PresetBadge[];
}
