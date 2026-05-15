import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DashboardView } from '@/components/dashboard-view';
import { fetchHabits } from '@/lib/habits';
import { fetchAllLogsForDate } from '@/lib/habit-logs';
import { Habit } from '@/lib/types';

const styles = {
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
};

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyValues, setDailyValues] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  // Generate dates for last 120 days (covers year view)
  const last120Days = useMemo(() => {
    const dates: string[] = [];
    for (let i = 119; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedHabits = await fetchHabits();
        setHabits(fetchedHabits);

        // Load logs for last 120 days
        const weekLogs: Record<string, Record<string, number>> = {};
        for (const date of last120Days) {
          weekLogs[date] = await fetchAllLogsForDate(date);
        }
        setDailyValues(weekLogs);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [last120Days]);

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
        <DashboardView habits={habits} dailyValues={dailyValues} />
      </ScrollView>
    </SafeAreaView>
  );
}
