import { Habit, CategoryType } from './types';

export interface DataPoint {
  label: string;
  date: string;
  value: number; // 0-100
}

export interface ChartData {
  global: DataPoint[];
  self_care: DataPoint[];
  dev_perso: DataPoint[];
  vie_familiale: DataPoint[];
  vie_pro: DataPoint[];
}

type ViewMode = 'week' | 'month' | 'quarter' | 'year';

/**
 * Aggregate habit completion data for chart display
 */
export function aggregateChartData(
  habits: Habit[],
  dailyValues: Record<string, Record<string, number>>,
  viewMode: ViewMode
): ChartData {
  const today = new Date();

  if (viewMode === 'week') {
    return aggregateWeekly(habits, dailyValues, today);
  } else if (viewMode === 'month') {
    return aggregateMonthly(habits, dailyValues, today);
  } else if (viewMode === 'quarter') {
    return aggregateQuarterly(habits, dailyValues, today);
  } else if (viewMode === 'year') {
    return aggregateYearly(habits, dailyValues, today);
  }

  return {
    global: [],
    self_care: [],
    dev_perso: [],
    vie_familiale: [],
    vie_pro: [],
  };
}

function aggregateWeekly(
  habits: Habit[],
  dailyValues: Record<string, Record<string, number>>,
  today: Date
): ChartData {
  const points: DataPoint[] = [];
  const categoryPoints: Record<CategoryType, DataPoint[]> = {
    self_care: [],
    dev_perso: [],
    vie_familiale: [],
    vie_pro: [],
  };

  // Get last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayNum = date.getDate();

    const dayLogs = dailyValues[dateStr] ?? {};
    const dayCompletion = calculateDayCompletion(habits, dayLogs);

    points.push({ label: `${dayNum}`, date: dateStr, value: dayCompletion });

    // Per category
    for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
      const catHabits = habits.filter(h => h.category === category);
      const catCompletion = calculateDayCompletion(catHabits, dayLogs);
      categoryPoints[category].push({ label: `${dayNum}`, date: dateStr, value: catCompletion });
    }
  }

  return {
    global: points,
    self_care: categoryPoints.self_care,
    dev_perso: categoryPoints.dev_perso,
    vie_familiale: categoryPoints.vie_familiale,
    vie_pro: categoryPoints.vie_pro,
  };
}

function aggregateMonthly(
  habits: Habit[],
  dailyValues: Record<string, Record<string, number>>,
  today: Date
): ChartData {
  const points: DataPoint[] = [];
  const categoryPoints: Record<CategoryType, DataPoint[]> = {
    self_care: [],
    dev_perso: [],
    vie_familiale: [],
    vie_pro: [],
  };

  // Get last 8 weeks
  for (let week = 7; week >= 0; week--) {
    let weekTotal = 0;
    let dayCount = 0;
    const categoryTotals: Record<CategoryType, number> = {
      self_care: 0,
      dev_perso: 0,
      vie_familiale: 0,
      vie_pro: 0,
    };
    const categoryDays: Record<CategoryType, number> = {
      self_care: 0,
      dev_perso: 0,
      vie_familiale: 0,
      vie_pro: 0,
    };

    // Average for 7 days in this week
    for (let day = 6; day >= 0; day--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7 + day));
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = dailyValues[dateStr] ?? {};

      const dayCompletion = calculateDayCompletion(habits, dayLogs);
      if (Object.keys(dayLogs).length > 0 || dayCompletion > 0) {
        weekTotal += dayCompletion;
        dayCount++;
      }

      // Per category
      for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
        const catHabits = habits.filter(h => h.category === category);
        const catCompletion = calculateDayCompletion(catHabits, dayLogs);
        if (Object.keys(dayLogs).length > 0 || catCompletion > 0) {
          categoryTotals[category] += catCompletion;
          categoryDays[category]++;
        }
      }
    }

    const weekLabel = `W${week + 1}`;
    const weekValue = dayCount > 0 ? Math.round(weekTotal / dayCount) : 0;
    points.push({ label: weekLabel, date: '', value: weekValue });

    for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
      const catValue = categoryDays[category] > 0 ? Math.round(categoryTotals[category] / categoryDays[category]) : 0;
      categoryPoints[category].push({ label: weekLabel, date: '', value: catValue });
    }
  }

  return {
    global: points.reverse(),
    self_care: categoryPoints.self_care.reverse(),
    dev_perso: categoryPoints.dev_perso.reverse(),
    vie_familiale: categoryPoints.vie_familiale.reverse(),
    vie_pro: categoryPoints.vie_pro.reverse(),
  };
}

function aggregateQuarterly(
  habits: Habit[],
  dailyValues: Record<string, Record<string, number>>,
  today: Date
): ChartData {
  const points: DataPoint[] = [];
  const categoryPoints: Record<CategoryType, DataPoint[]> = {
    self_care: [],
    dev_perso: [],
    vie_familiale: [],
    vie_pro: [],
  };

  // Get last 12 weeks
  for (let week = 11; week >= 0; week--) {
    let weekTotal = 0;
    let dayCount = 0;
    const categoryTotals: Record<CategoryType, number> = {
      self_care: 0,
      dev_perso: 0,
      vie_familiale: 0,
      vie_pro: 0,
    };
    const categoryDays: Record<CategoryType, number> = {
      self_care: 0,
      dev_perso: 0,
      vie_familiale: 0,
      vie_pro: 0,
    };

    for (let day = 6; day >= 0; day--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7 + day));
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = dailyValues[dateStr] ?? {};

      const dayCompletion = calculateDayCompletion(habits, dayLogs);
      if (Object.keys(dayLogs).length > 0 || dayCompletion > 0) {
        weekTotal += dayCompletion;
        dayCount++;
      }

      for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
        const catHabits = habits.filter(h => h.category === category);
        const catCompletion = calculateDayCompletion(catHabits, dayLogs);
        if (Object.keys(dayLogs).length > 0 || catCompletion > 0) {
          categoryTotals[category] += catCompletion;
          categoryDays[category]++;
        }
      }
    }

    const weekLabel = `W${week + 1}`;
    const weekValue = dayCount > 0 ? Math.round(weekTotal / dayCount) : 0;
    points.push({ label: weekLabel, date: '', value: weekValue });

    for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
      const catValue = categoryDays[category] > 0 ? Math.round(categoryTotals[category] / categoryDays[category]) : 0;
      categoryPoints[category].push({ label: weekLabel, date: '', value: catValue });
    }
  }

  return {
    global: points.reverse(),
    self_care: categoryPoints.self_care.reverse(),
    dev_perso: categoryPoints.dev_perso.reverse(),
    vie_familiale: categoryPoints.vie_familiale.reverse(),
    vie_pro: categoryPoints.vie_pro.reverse(),
  };
}

function aggregateYearly(
  habits: Habit[],
  dailyValues: Record<string, Record<string, number>>,
  today: Date
): ChartData {
  const points: DataPoint[] = [];
  const categoryPoints: Record<CategoryType, DataPoint[]> = {
    self_care: [],
    dev_perso: [],
    vie_familiale: [],
    vie_pro: [],
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get last 12 months
  for (let month = 11; month >= 0; month--) {
    let monthTotal = 0;
    let dayCount = 0;
    const categoryTotals: Record<CategoryType, number> = {
      self_care: 0,
      dev_perso: 0,
      vie_familiale: 0,
      vie_pro: 0,
    };
    const categoryDays: Record<CategoryType, number> = {
      self_care: 0,
      dev_perso: 0,
      vie_familiale: 0,
      vie_pro: 0,
    };

    const targetMonth = today.getMonth() - month;
    const targetYear = today.getFullYear() - (targetMonth < 0 ? 1 : 0);
    const actualMonth = (targetMonth + 12) % 12;

    // Get days in this month
    const daysInMonth = new Date(targetYear, actualMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, actualMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = dailyValues[dateStr] ?? {};

      const dayCompletion = calculateDayCompletion(habits, dayLogs);
      if (Object.keys(dayLogs).length > 0 || dayCompletion > 0) {
        monthTotal += dayCompletion;
        dayCount++;
      }

      for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
        const catHabits = habits.filter(h => h.category === category);
        const catCompletion = calculateDayCompletion(catHabits, dayLogs);
        if (Object.keys(dayLogs).length > 0 || catCompletion > 0) {
          categoryTotals[category] += catCompletion;
          categoryDays[category]++;
        }
      }
    }

    const monthLabel = months[actualMonth];
    const monthValue = dayCount > 0 ? Math.round(monthTotal / dayCount) : 0;
    points.push({ label: monthLabel, date: '', value: monthValue });

    for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
      const catValue = categoryDays[category] > 0 ? Math.round(categoryTotals[category] / categoryDays[category]) : 0;
      categoryPoints[category].push({ label: monthLabel, date: '', value: catValue });
    }
  }

  return {
    global: points.reverse(),
    self_care: categoryPoints.self_care.reverse(),
    dev_perso: categoryPoints.dev_perso.reverse(),
    vie_familiale: categoryPoints.vie_familiale.reverse(),
    vie_pro: categoryPoints.vie_pro.reverse(),
  };
}

function calculateDayCompletion(habits: Habit[], dayLogs: Record<string, number>): number {
  if (habits.length === 0) return 0;

  let totalCompletion = 0;
  for (const habit of habits) {
    const value = dayLogs[habit.id] ?? 0;
    let completion = 0;

    if (habit.frequency_type === 'per_day') {
      if (value < habit.min_value) {
        completion = 0;
      } else if (value >= habit.target_value) {
        completion = 100;
      } else {
        completion = ((value - habit.min_value) / (habit.target_value - habit.min_value)) * 100;
      }
    } else if (habit.frequency_type === 'times_per_day') {
      completion = Math.min(100, (value / habit.target_value) * 100);
    } else if (habit.frequency_type === 'times_per_week') {
      completion = Math.min(100, (value / habit.target_value) * 100);
    }

    totalCompletion += completion;
  }

  return Math.round(totalCompletion / habits.length);
}
