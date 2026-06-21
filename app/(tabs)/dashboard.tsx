import React, { useEffect, useState } from 'react';
import { SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { PerformanceCharts } from '@/components/performance-charts';
import { fetchHabits } from '@/lib/habits';
import { fetchAllLogsForDateRange } from '@/lib/habit-logs';
import { Habit } from '@/lib/types';
import { useAppTheme } from '@/hooks/use-app-theme';

const styles = {
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
};

export default function DashboardScreen() {
  const { colors, styles: themeStyles } = useAppTheme();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyValues, setDailyValues] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedHabits = await fetchHabits();
        setHabits(fetchedHabits);

        // Load logs for last 120 days (covers year view)
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 119);
        const logs = await fetchAllLogsForDateRange(
          startDate.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        setDailyValues(logs);
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
          themeStyles.screen,
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.text}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  return (
      <SafeAreaView
        style={[
          styles.container,
          themeStyles.screen,
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            themeStyles.screen,
          ]}
        >
        <PerformanceCharts
          habits={habits}
          dailyValues={dailyValues}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
