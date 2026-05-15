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

type ViewMode = 'week' | 'month' | 'year';

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
    const monthNum = date.getMonth() + 1;
    const label = `${dayNum}/${monthNum}`;

    const dayLogs = dailyValues[dateStr] ?? {};
    const dayCompletion = calculateDayCompletion(habits, dayLogs);

    points.push({ label, date: dateStr, value: dayCompletion });

    // Per category
    for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
      const catHabits = habits.filter(h => h.category === category);
      const catCompletion = calculateDayCompletion(catHabits, dayLogs);
      categoryPoints[category].push({ label, date: dateStr, value: catCompletion });
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

  // Get last 30 days (4-5 weeks), 1 point per week starting from oldest
  const weeks: { start: number; end: number }[] = [
    { start: 27, end: 33 }, // Week 1 (oldest)
    { start: 20, end: 26 }, // Week 2
    { start: 13, end: 19 }, // Week 3
    { start: 6, end: 12 },  // Week 4
    { start: 0, end: 5 },   // Week 5 (current)
  ];

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
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

    // Get representative date (middle of week)
    const midDayOffset = Math.floor((week.start + week.end) / 2);
    const midDate = new Date(today);
    midDate.setDate(midDate.getDate() - midDayOffset);
    const dayOfMonth = midDate.getDate();
    const monthNum = midDate.getMonth() + 1;
    const weekLabel = `${String(dayOfMonth).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}`;

    for (let dayOffset = week.start; dayOffset <= week.end && dayOffset >= 0; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = dailyValues[dateStr] ?? {};

      const dayCompletion = calculateDayCompletion(habits, dayLogs);
      weekTotal += dayCompletion;
      dayCount++;

      for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
        const catHabits = habits.filter(h => h.category === category);
        const catCompletion = calculateDayCompletion(catHabits, dayLogs);
        categoryTotals[category] += catCompletion;
        categoryDays[category]++;
      }
    }

    const weekValue = dayCount > 0 ? Math.round(weekTotal / dayCount) : 0;
    points.push({ label: weekLabel, date: '', value: weekValue });

    for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
      const catValue = categoryDays[category] > 0 ? Math.round(categoryTotals[category] / categoryDays[category]) : 0;
      categoryPoints[category].push({ label: weekLabel, date: '', value: catValue });
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

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get last 12 months, ending with current month
  for (let monthsBack = 11; monthsBack >= 0; monthsBack--) {
    const targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() - monthsBack);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

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

    // Get all days in this month
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const startDay = monthsBack === 0 ? 1 : 1; // Current month: only count until today
    const endDay = monthsBack === 0 ? today.getDate() : daysInMonth; // Current month: stop at today

    for (let day = startDay; day <= endDay; day++) {
      const date = new Date(targetYear, targetMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = dailyValues[dateStr] ?? {};

      const dayCompletion = calculateDayCompletion(habits, dayLogs);
      monthTotal += dayCompletion;
      dayCount++;

      for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
        const catHabits = habits.filter(h => h.category === category);
        const catCompletion = calculateDayCompletion(catHabits, dayLogs);
        categoryTotals[category] += catCompletion;
        categoryDays[category]++;
      }
    }

    const monthLabel = monthLabels[targetMonth];
    const monthValue = dayCount > 0 ? Math.round(monthTotal / dayCount) : 0;
    points.push({ label: monthLabel, date: '', value: monthValue });

    for (const category of ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const) {
      const catValue = categoryDays[category] > 0 ? Math.round(categoryTotals[category] / categoryDays[category]) : 0;
      categoryPoints[category].push({ label: monthLabel, date: '', value: catValue });
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
