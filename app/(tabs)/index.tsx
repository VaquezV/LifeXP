// lifexp/app/(tabs)/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { Colors } from '@/constants/Colors';
import { AppHeader } from '@/components/app-header';
import { WeekSummary } from '@/components/week-summary';
import { CategorySection } from '@/components/category-section';
import { fetchHabits } from '@/lib/habits';
import { fetchAllLogsForDate, logHabitValue } from '@/lib/habit-logs';
import { calculateDayCompletion, calculateWeeklyScore } from '@/lib/scoring';
import { Habit, CategoryType } from '@/lib/types';
import { requireUserId } from '@/lib/auth';

function getCategories(t: any): { key: CategoryType; label: string }[] {
  return [
    { key: 'self_care', label: t('selfCare') },
    { key: 'dev_perso', label: t('personalDev') },
    { key: 'vie_familiale', label: t('familyLife') },
    { key: 'vie_pro', label: t('professional') },
  ];
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDayAbbr(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return ['DI', 'LU', 'MA', 'ME', 'JE', 'VE', 'SA'][date.getDay()];
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { t } = useTranslation();
  const colors = Colors[colorScheme];
  const initialCategories = getCategories(t);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyValues, setDailyValues] = useState<
    Record<string, Record<string, number>>
  >({}); // date -> (habit_id -> value)
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [categories, setCategories] = useState(initialCategories);

  // Get last 7 days ending today
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i);
      dates.push(toDateKey(date));
    }
    return dates;
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const weekDays = useMemo(
    () =>
      weekDates.map(date => {
        const completion = calculateDayCompletion(habits, dailyValues[date] ?? {});

        return {
          abbr: getWeekDayAbbr(date),
          date: new Date(`${date}T12:00:00`).getDate().toString().padStart(2, '0'),
          completion,
          isToday: date === todayKey,
        };
      }),
    [dailyValues, habits, todayKey, weekDates]
  );

  // Load habits and logs
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedHabits = await fetchHabits();
        setHabits(fetchedHabits);

        // Load logs for this week
        const weekLogs: Record<string, Record<string, number>> = {};
        for (const date of weekDates) {
          weekLogs[date] = await fetchAllLogsForDate(date);
        }
        setDailyValues(weekLogs);

        // Calculate weekly score
        const score = calculateWeeklyScore(fetchedHabits, weekLogs);
        setWeeklyScore(score);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [weekDates]);

  const handleValueChange = async (habitId: string, date: string, value: number) => {
    try {
      const habit = habits.find((item) => item.id === habitId);
      await logHabitValue(
        await requireUserId(),
        habitId,
        date,
        value,
        habit?.preset_habit_id ?? null,
      );

      // Update local state (score recalculation handled by useEffect)
      setDailyValues(prev => ({
        ...prev,
        [date]: {
          ...(prev[date] ?? {}),
          [habitId]: value,
        },
      }));
    } catch (error) {
      console.error('Error saving habit value:', error);
    }
  };

  const handleHabitUpdate = (updatedHabit: Habit) => {
    setHabits(prev =>
      prev.map(h => h.id === updatedHabit.id ? updatedHabit : h)
    );
  };

  const handleHabitDelete = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  // Recalculate weekly score whenever dailyValues or habits change
  useEffect(() => {
    const score = calculateWeeklyScore(habits, dailyValues);
    setWeeklyScore(score);
  }, [dailyValues, habits]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator
          size="large"
          color={colors.tint}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff', paddingTop: 8 }]}
    >
      <FlatList
        data={['app-header', 'week-header', ...categories.map(cat => cat.key)]}
        keyExtractor={item => item}
        renderItem={({ item }) => {
          if (item === 'app-header') {
            return <AppHeader />;
          }

          if (item === 'week-header') {
            return habits.length > 0 ? (
              <WeekSummary
                weekDays={weekDays}
                weeklyCompletion={weeklyScore}
                accentColor="#2a9d8f"
              />
            ) : null;
          }

          const category = item as CategoryType;
          const categoryHabits = habits.filter(h => h.category === category);
          const catData = categories.find(c => c.key === category);
          const categoryLabel = catData?.label || category;

          const handleUpdateCategory = (newLabel: string, newColor: string) => {
            setCategories(prev =>
              prev.map(c =>
                c.key === category ? { ...c, label: newLabel } : c
              )
            );
          };

          return (
            <CategorySection
              key={category}
              category={category}
              categoryLabel={categoryLabel}
              habits={categoryHabits}
              weekDates={weekDates}
              weekValues={dailyValues}
              onHabitValueChange={handleValueChange}
              onHabitUpdate={handleHabitUpdate}
              onHabitDelete={handleHabitDelete}
              onUpdateCategory={handleUpdateCategory}
            />
          );
        }}
        scrollEnabled={true}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
