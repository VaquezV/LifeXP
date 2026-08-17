import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, ActivityIndicator, FlatList, View, StyleSheet } from 'react-native';
import { PerformanceItem } from '@/components/performance-item';
import { PerformanceGrid } from '@/components/performance-grid';
import { ThemedText } from '@/components/themed-text';
import { fetchHabits } from '@/lib/habits';
import { fetchAllLogsForDateRange } from '@/lib/habit-logs';
import { supabase } from '@/lib/supabase';
import { Habit, CATEGORY_KEYS, CategoryType } from '@/lib/types';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { useTranslation } from '@/hooks/use-translation';
import { CATEGORY_TRANSLATION_KEY } from '@/lib/translations';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ensureContrast } from '@/lib/theme-evolution';
import { calculateHabitCompletion } from '@/lib/scoring';

// Fallback if the active_habit_history_days() RPC is unreachable (e.g. offline);
// kept in sync server-side with the habit_logs purge window (see purge_old_habit_logs()).
const DEFAULT_HISTORY_DAYS = 205;

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardScreen() {
  const theme = useWolfLevelTheme();
  const { t } = useTranslation();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyValues, setDailyValues] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [historyDays, setHistoryDays] = useState(DEFAULT_HISTORY_DAYS);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedHabits = await fetchHabits();
        setHabits(fetchedHabits);

        const days = supabase
          ? await supabase.rpc('active_habit_history_days').then(
              ({ data }) => (typeof data === 'number' ? data : DEFAULT_HISTORY_DAYS),
              () => DEFAULT_HISTORY_DAYS,
            )
          : DEFAULT_HISTORY_DAYS;
        setHistoryDays(days);

        // Load logs for the last `days` days
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (days - 1));
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

  // Construire performance data par habit (fenêtre = historyDays)
  const performanceData: Record<string, Record<number, number>> = useMemo(() => {
    const data: Record<string, Record<number, number>> = {};
    habits.forEach((habit) => {
      data[habit.id] = {};
      for (let i = 0; i < historyDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (historyDays - 1 - i));
        const dateKey = toDateKey(date);
        const value = dailyValues[dateKey]?.[habit.id] ?? 0;

        let percentage = 0;
        if (habit.frequency_type === 'duration_per_week' || habit.frequency_type === 'unit_per_week') {
          const rollingTotal = Array.from({ length: 7 }, (_, offset) => {
            const rollingDate = new Date(date);
            rollingDate.setDate(rollingDate.getDate() - offset);
            return dailyValues[toDateKey(rollingDate)]?.[habit.id] ?? 0;
          }).reduce((sum, minutes) => sum + minutes, 0);
          percentage = calculateHabitCompletion(habit, rollingTotal);
        } else if (habit.frequency_type === 'times_per_week') {
          percentage = value === 0 ? 0 : 100;
        } else if (habit.frequency_type === 'times_per_day') {
          percentage = (value / habit.target_value) * 100;
        } else if (habit.frequency_type === 'per_day') {
          percentage = (value / habit.target_value) * 100;
        } else if (habit.frequency_type === 'unit_per_day') {
          percentage = (value / habit.target_value) * 100;
        }

        data[habit.id][i] = Math.min(100, Math.max(0, percentage));
      }
    });
    return data;
  }, [habits, dailyValues, historyDays]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.bgPrimary }]}>
        <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bgPrimary }]}>
      <FlatList
        data={CATEGORY_KEYS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Performances</ThemedText>
            </View>
            {habits.length > 0 && (
              <PerformanceGrid
                data={performanceData}
                accentColor={theme.tint}
                cols={29}
                rows={5}
              />
            )}
          </View>
        }
        renderItem={({ item: category }) => {
          const categoryHabits = habits.filter((h) => h.category === category);
          if (categoryHabits.length === 0) return null;

          const categoryLabel = t(CATEGORY_TRANSLATION_KEY[category]);
          const categoryColor = CATEGORY_COLORS[category];
          const accentColor = ensureContrast(categoryColor.mid, theme.surface, 4.5);

          return (
            <View key={category} style={{ backgroundColor: theme.bgPrimary }}>
              <ThemedText
                style={[
                  styles.categoryTitle,
                  { color: theme.text, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
                ]}
              >
                {categoryLabel}
              </ThemedText>

              <View style={{ paddingHorizontal: 16 }}>
                {categoryHabits.map((habit) => (
                  <PerformanceItem
                    key={habit.id}
                    habit={habit}
                    performanceData={performanceData[habit.id] || {}}
                  />
                ))}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
