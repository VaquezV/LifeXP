// lifexp/app/(tabs)/index.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/Colors';
import { WeekHeader } from '@/components/week-header';
import { CategorySection } from '@/components/category-section';
import { WeeklyScore } from '@/components/weekly-score';
import { fetchHabits } from '@/lib/habits';
import { fetchAllLogsForDate, logHabitValue } from '@/lib/habit-logs';
import { calculateDayCompletion, calculateWeeklyScore } from '@/lib/scoring';
import { Habit, CategoryType } from '@/lib/types';
import { SINGLE_USER_ID } from '@/lib/supabase';

const CATEGORIES: Array<{ key: CategoryType; label: string }> = [
  { key: 'self_care', label: 'Self-Care' },
  { key: 'dev_perso', label: 'Dev Perso' },
  { key: 'vie_familiale', label: 'Vie Familiale' },
  { key: 'vie_pro', label: 'Vie Pro' },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyValues, setDailyValues] = useState<
    Record<string, Record<string, number>>
  >({}); // date -> (habit_id -> value)
  const [weeklyScore, setWeeklyScore] = useState(0);

  // Get current week (Mon-Sun) - memoized to prevent infinite loops
  const weekDates = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

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

  const handleValueChange = async (habitId: string, value: number) => {
    const today = new Date().toISOString().split('T')[0];

    try {
      await logHabitValue(SINGLE_USER_ID, habitId, today, value);

      // Update local state (score recalculation handled by useEffect)
      setDailyValues(prev => ({
        ...prev,
        [today]: {
          ...(prev[today] ?? {}),
          [habitId]: value,
        },
      }));
    } catch (error) {
      console.error('Error saving habit value:', error);
    }
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

  // Build day headers
  const dayNames = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
  const dayHeaders = weekDates.map((date, index) => {
    const todayLogs = dailyValues[date] ?? {};
    const completion = calculateDayCompletion(habits, todayLogs);
    // Simple logic: use the first habit's category for dominant color
    const dominantCategory: CategoryType = 'self_care';

    return {
      date,
      dayName: dayNames[index],
      completion,
      category: dominantCategory,
    };
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={['week-header', ...CATEGORIES.map(cat => cat.key), 'weekly-score']}
        keyExtractor={item => item}
        renderItem={({ item }) => {
          if (item === 'week-header') {
            return <WeekHeader days={dayHeaders} />;
          }

          if (item === 'weekly-score') {
            return <WeeklyScore percentage={weeklyScore} />;
          }

          const category = item as CategoryType;
          const categoryHabits = habits.filter(h => h.category === category);
          const todayStr = new Date().toISOString().split('T')[0];
          const todayValues = dailyValues[todayStr] ?? {};

          return (
            <CategorySection
              category={category}
              habits={categoryHabits}
              habitValues={todayValues}
              onHabitValueChange={handleValueChange}
            />
          );
        }}
        scrollEnabled={true}
        contentContainerStyle={styles.scrollContent}
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
