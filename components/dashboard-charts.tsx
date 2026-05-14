import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from 'react';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { CategoryType } from '@/lib/types';

type ViewMode = 'week' | 'month' | 'quarter' | 'year';

export interface DashboardChartsProps {
  globalWeeklyScores: number[]; // Last 12 weeks or months
  categoryScores: Record<CategoryType, number[]>;
}

const CATEGORY_LABELS: Record<CategoryType, string> = {
  self_care: 'Self Care',
  dev_perso: 'Personal Dev',
  vie_familiale: 'Family Life',
  vie_pro: 'Professional',
};

export function DashboardCharts({
  globalWeeklyScores,
  categoryScores,
}: DashboardChartsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const getDataPoints = (scores: number[]) => {
    if (viewMode === 'week') return scores.slice(-12);
    if (viewMode === 'month') return scores.slice(-12);
    if (viewMode === 'quarter') return scores.slice(-12);
    return scores.slice(-12);
  };

  const renderSimpleChart = (scores: number[], color: string, height: number = 120) => {
    const dataPoints = getDataPoints(scores);
    const maxScore = 100;
    const chartWidth = dataPoints.length * 20;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
        <View style={[styles.chart, { height }]}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => (
            <View
              key={`line-${val}`}
              style={[
                styles.gridLine,
                {
                  bottom: `${val}%`,
                  borderTopColor: isDark ? '#222222' : '#eeeeee',
                },
              ]}
            />
          ))}

          {/* Data points */}
          {dataPoints.map((score, index) => {
            const chartHeight = height - 20;
            const pointHeight = (score / maxScore) * chartHeight;
            return (
              <View
                key={`point-${index}`}
                style={[
                  styles.dataBar,
                  {
                    height: pointHeight,
                    backgroundColor: color,
                    marginBottom: chartHeight - pointHeight,
                  },
                ]}
              />
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' },
      ]}
    >
      <View style={styles.header}>
        <ThemedText
          style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}
        >
          Performance
        </ThemedText>
      </View>

      {/* View Mode Selector */}
      <View style={styles.modeSelector}>
        {(['week', 'month', 'quarter', 'year'] as const).map((mode) => (
          <Pressable
            key={mode}
            style={[
              styles.modeButton,
              viewMode === mode && {
                backgroundColor: '#4caf50',
                borderColor: '#4caf50',
              },
              viewMode !== mode && {
                borderColor: isDark ? '#444444' : '#cccccc',
                borderWidth: 1,
              },
            ]}
            onPress={() => setViewMode(mode)}
          >
            <ThemedText
              style={[
                styles.modeButtonText,
                {
                  color:
                    viewMode === mode
                      ? '#ffffff'
                      : isDark
                        ? '#aaaaaa'
                        : '#666666',
                },
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Global Chart */}
      <View style={styles.chartSection}>
        <ThemedText
          style={[
            styles.chartTitle,
            { color: isDark ? '#ffffff' : '#000000' },
          ]}
        >
          Overall Progress
        </ThemedText>
        {renderSimpleChart(globalWeeklyScores, '#4caf50')}
      </View>

      {/* Category Charts */}
      {(Object.keys(categoryScores) as CategoryType[]).map((category) => {
        const color = CATEGORY_COLORS[category].mid;
        return (
          <View key={category} style={styles.chartSection}>
            <ThemedText
              style={[
                styles.chartTitle,
                { color: isDark ? '#ffffff' : '#000000' },
              ]}
            >
              {CATEGORY_LABELS[category]}
            </ThemedText>
            {renderSimpleChart(categoryScores[category], color, 100)}
          </View>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
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
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartScroll: {
    width: '100%',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingVertical: 12,
    minWidth: 240,
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    borderTopWidth: 1,
  },
  dataBar: {
    width: 16,
    borderRadius: 4,
    minHeight: 2,
  },
});
