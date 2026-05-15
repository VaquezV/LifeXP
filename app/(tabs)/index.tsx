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
import { AppHeader } from '@/components/app-header';
import { WeekSummary } from '@/components/week-summary';
import { CategorySection } from '@/components/category-section';
import { WeeklyScore } from '@/components/weekly-score';
import { fetchHabits } from '@/lib/habits';
import { fetchAllLogsForDate, logHabitValue } from '@/lib/habit-logs';
import { calculateWeeklyScore } from '@/lib/scoring';
import { Habit, CategoryType } from '@/lib/types';
import { SINGLE_USER_ID } from '@/lib/supabase';

const CATEGORIES: { key: CategoryType; label: string }[] = [
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

  // Get last 7 days ending today
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
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

  const handleValueChange = async (habitId: string, date: string, value: number) => {
    try {
      await logHabitValue(SINGLE_USER_ID, habitId, date, value);

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
        data={['app-header', 'week-header', ...CATEGORIES.map(cat => cat.key), 'weekly-score']}
        keyExtractor={item => item}
        renderItem={({ item }) => {
          if (item === 'app-header') {
            return <AppHeader weeklyScore={weeklyScore} />;
          }

          if (item === 'week-header') {
            return habits.length > 0 ? (
              <WeekSummary
                weekDays={weekDates.map((date, idx) => ({
                  abbr: ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'][new Date(date).getDay()],
                  date: new Date(date).getDate().toString().padStart(2, '0'),
                  isCompleted: Math.random() > 0.5, // Replace with actual completion logic
                  isToday: date === new Date().toISOString().split('T')[0],
                }))}
                weeklyCompletion={weeklyScore}
                accentColor="#2a9d8f"
              />
            ) : null;
          }

          if (item === 'weekly-score') {
            return <WeeklyScore percentage={weeklyScore} />;
          }

          const category = item as CategoryType;
          const categoryHabits = habits.filter(h => h.category === category);

          return (
            <CategorySection
              category={category}
              habits={categoryHabits}
              weekDates={weekDates}
              weekValues={dailyValues}
              onHabitValueChange={handleValueChange}
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
