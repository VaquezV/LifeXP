import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LineChart } from './line-chart';
import { aggregateChartData, ChartData } from '@/lib/chart-data';
import { Habit, CategoryType } from '@/lib/types';

type ViewMode = 'week' | 'month' | 'quarter' | 'year';

interface PerformanceChartsProps {
  habits: Habit[];
  dailyValues: Record<string, Record<string, number>>;
}

const CATEGORY_LABELS: Record<CategoryType, string> = {
  self_care: 'Self Care',
  dev_perso: 'Personal Dev',
  vie_familiale: 'Family Life',
  vie_pro: 'Professional',
};

export function PerformanceCharts({
  habits,
  dailyValues,
}: PerformanceChartsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Aggregate chart data based on view mode
  const chartData = useMemo(() => {
    return aggregateChartData(habits, dailyValues, viewMode);
  }, [habits, dailyValues, viewMode]);

  // Calculate overall score from global data
  const overallScore = useMemo(() => {
    if (chartData.global.length === 0) return 0;
    const sum = chartData.global.reduce((acc, point) => acc + point.value, 0);
    return Math.round(sum / chartData.global.length);
  }, [chartData.global]);

  // Create chart data for overall progress (global only)
  const overallChartData = useMemo(() => ({
    global: chartData.global,
    self_care: [],
    dev_perso: [],
    vie_familiale: [],
    vie_pro: [],
  } as ChartData), [chartData.global]);

  // Create chart data for each category
  const createCategoryChartData = (category: CategoryType): ChartData => ({
    global: [],
    self_care: category === 'self_care' ? chartData.self_care : [],
    dev_perso: category === 'dev_perso' ? chartData.dev_perso : [],
    vie_familiale: category === 'vie_familiale' ? chartData.vie_familiale : [],
    vie_pro: category === 'vie_pro' ? chartData.vie_pro : [],
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Performance</ThemedText>
      </View>

      {/* Period selector */}
      <View style={styles.modeSelector}>
        {(['week', 'month', 'quarter', 'year'] as const).map((mode) => (
          <Pressable
            key={mode}
            style={[
              styles.modeButton,
              viewMode === mode && styles.modeButtonActive,
              viewMode !== mode && styles.modeButtonInactive,
            ]}
            onPress={() => setViewMode(mode)}
          >
            <ThemedText
              style={[
                styles.modeButtonText,
                viewMode === mode && styles.modeButtonTextActive,
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Chart */}
        <View style={styles.chartSection}>
          <ThemedText style={styles.chartTitle}>Overall Progress</ThemedText>
          <LineChart
            data={overallChartData}
            showGlobal={true}
            showCategories={false}
          />
        </View>

        {/* Category Charts */}
        {(['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const).map((category) => {
          const label = CATEGORY_LABELS[category];
          const categoryChartData = createCategoryChartData(category);

          return (
            <View key={category} style={styles.chartSection}>
              <ThemedText style={styles.chartTitle}>{label}</ThemedText>
              <LineChart
                data={categoryChartData}
                showGlobal={false}
                showCategories={true}
              />
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2a9d8f',
    borderColor: '#2a9d8f',
  },
  modeButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: '#333333',
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  chartSection: {
    marginBottom: 28,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
});
