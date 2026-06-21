import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useTranslation } from '@/hooks/use-translation';
import { LineChart } from './line-chart';
import { aggregateChartData } from '@/lib/chart-data';
import { Habit, CategoryType } from '@/lib/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { CATEGORY_COLORS } from '@/constants/Colors';

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
  const { colors, styles: themeStyles } = useAppTheme();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const categoryLabels = getCategoryLabels(t);

  // Aggregate chart data based on view mode
  const chartData = useMemo(() => {
    return aggregateChartData(habits, dailyValues, viewMode);
  }, [habits, dailyValues, viewMode]);

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

  const categoryChartColors: Record<CategoryType, string> = {
    self_care: CATEGORY_COLORS.self_care.mid,
    dev_perso: CATEGORY_COLORS.dev_perso.mid,
    vie_familiale: CATEGORY_COLORS.vie_familiale.mid,
    vie_pro: CATEGORY_COLORS.vie_pro.mid,
  };

  return (
    <ThemedView style={[styles.container, themeStyles.surface]}>
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
              viewMode === mode
                ? { backgroundColor: colors.tint, borderColor: colors.tint }
                : { backgroundColor: 'transparent', borderColor: colors.borderSoft, borderWidth: 1 },
            ]}
            onPress={() => setViewMode(mode)}
          >
            <ThemedText
              style={[
                styles.modeButtonText,
                { color: viewMode === mode ? colors.onPrimary : colors.textMuted },
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
          color={colors.textMuted}
        />

        {/* Category Charts */}
        {(['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as const).map((category) => {
          const label = categoryLabels[category];
          const categoryData = getCategoryData(category);
          return (
            <LineChart
              key={category}
              title={label}
              data={categoryData}
              color={categoryChartColors[category]}
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
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
