export type CategoryType = 'self_care' | 'dev_perso' | 'vie_familiale' | 'vie_pro';
export type FrequencyType = 'per_day' | 'times_per_day' | 'times_per_week';

export interface Habit {
  id: string;
  user_id: string;
  category: CategoryType;
  name: string;
  emoji: string;
  frequency_type: FrequencyType;
  frequency_value: number;
  min_value: number;
  target_value: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
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
