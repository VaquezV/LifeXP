import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { LineChart } from './line-chart';
import { aggregateChartData, ChartData } from '@/lib/chart-data';
import { Habit, CategoryType } from '@/lib/types';

type ViewMode = 'week' | 'month' | 'year';

interface PerformanceChartsProps {
  habits: Habit[];
  dailyValues: Record<string, Record<string, number>>;
}

function getCategoryLabels(t: any): Record<CategoryType, string> {
  return {
    self_care: t('selfCare'),
    dev_perso: t('personalDev'),
    vie_familiale: t('familyLife'),
    vie_pro: t('professional'),
  };
}

export function PerformanceCharts({
  habits,
  dailyValues,
}: PerformanceChartsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const categoryLabels = getCategoryLabels(t);

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

  // Get category data
  const getCategoryData = (category: CategoryType) => {
    switch (category) {
      case 'self_care': return chartData.self_care;
      case 'dev_perso': return chartData.dev_perso;
      case 'vie_familiale': return chartData.vie_familiale;
      case 'vie_pro': return chartData.vie_pro;
    }
  };

  const modeLabels: Record<ViewMode, string> = {
    week: t('semaine'),
    month: t('mois'),
    year: t('annee'),
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{t('performance')}</ThemedText>
      </View>

      {/* Period selector */}
      <View style={styles.modeSelector}>
        {(['week', 'month', 'year'] as const).map((mode) => (
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
              {modeLabels[mode]}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Chart */}
        <LineChart
          title={t('overallProgress')}
          data={chartData.global}
          color="#999999"
        />

        {/* Category Charts */}
        {(['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const).map((category) => {
          const label = categoryLabels[category];
          const categoryData = getCategoryData(category);
          const colors: Record<CategoryType, string> = {
            self_care: '#2a9d8f',
            dev_perso: '#aa96da',
            vie_familiale: '#f38181',
            vie_pro: '#5dade2',
          };

          return (
            <LineChart
              key={category}
              title={label}
              data={categoryData}
              color={colors[category]}
            />
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
