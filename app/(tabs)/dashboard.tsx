import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DashboardCharts } from '@/components/dashboard-charts';
import { fetchHabits } from '@/lib/habits';
import { fetchAllLogsForDate, logHabitValue } from '@/lib/habit-logs';
import { calculateWeeklyScore } from '@/lib/scoring';
import { Habit, CategoryType } from '@/lib/types';

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyScores, setWeeklyScores] = useState<number[]>([]);
  const [categoryScores, setCategoryScores] = useState<Record<CategoryType, number[]>>({
    self_care: [],
    dev_perso: [],
    vie_familiale: [],
    vie_pro: [],
  });

  // Generate dummy data for last 12 weeks
  const generateDummyData = () => {
    const globalScores = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 50 + 40)
    );
    const catScores: Record<CategoryType, number[]> = {
      self_care: Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 50 + 40)
      ),
      dev_perso: Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 50 + 40)
      ),
      vie_familiale: Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 50 + 40)
      ),
      vie_pro: Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 50 + 40)
      ),
    };
    return { globalScores, catScores };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedHabits = await fetchHabits();
        setHabits(fetchedHabits);

        // For now, generate dummy data
        const { globalScores, catScores } = generateDummyData();
        setWeeklyScores(globalScores);
        setCategoryScores(catScores);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#000000' : '#ffffff' },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? '#ffffff' : '#000000'}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#ffffff' },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: isDark ? '#000000' : '#ffffff' },
        ]}
      >
        <DashboardCharts
          globalWeeklyScores={weeklyScores}
          categoryScores={categoryScores}
        />
      </ScrollView>
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
