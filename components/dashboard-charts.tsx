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

  const renderLineChart = (scores: number[], color: string, height: number = 160) => {
    const dataPoints = getDataPoints(scores);
    const maxScore = 100;
    const chartHeight = height - 40;
    const pointSpacing = dataPoints.length > 1 ? (250 / (dataPoints.length - 1)) : 0;

    // Generate SVG-like path for the line
    const points = dataPoints.map((score, index) => ({
      x: index * pointSpacing + 20,
      y: height - 20 - (score / maxScore) * chartHeight,
      score,
    }));

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
        <View style={[styles.chartContainer, { height, width: 270 }]}>
          {/* Y-axis labels and grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const yPos = height - 20 - ((val / 100) * chartHeight);
            return (
              <View key={`gridline-${val}`}>
                <View
                  style={[
                    styles.gridLine,
                    {
                      top: yPos,
                      borderTopColor: isDark ? '#222222' : '#eeeeee',
                    },
                  ]}
                />
                <ThemedText
                  style={[
                    styles.axisLabel,
                    {
                      top: yPos - 8,
                      color: isDark ? '#666666' : '#aaaaaa',
                    },
                  ]}
                >
                  {val}%
                </ThemedText>
              </View>
            );
          })}

          {/* Line connecting points */}
          {points.length > 1 && (
            <View
              style={[
                styles.linePath,
                {
                  width: (points[points.length - 1].x - points[0].x) + 20,
                  height: chartHeight,
                  top: 20,
                  left: points[0].x,
                },
              ]}
            >
              <View
                style={[
                  styles.line,
                  { borderTopColor: color },
                  {
                    width: (points[points.length - 1].x - points[0].x) + 2,
                  },
                ]}
              />
            </View>
          )}

          {/* Data point circles */}
          {points.map((point, index) => (
            <View
              key={`point-${index}`}
              style={[
                styles.dataPoint,
                {
                  left: point.x - 5,
                  top: point.y - 5,
                  backgroundColor: color,
                },
              ]}
            />
          ))}
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
        {renderLineChart(globalWeeklyScores, '#4caf50')}
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
            {renderLineChart(categoryScores[category], color, 140)}
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
    marginBottom: 28,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartScroll: {
    width: '100%',
  },
  chartContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  axisLabel: {
    position: 'absolute',
    left: -28,
    fontSize: 10,
    fontWeight: '600',
    width: 24,
    textAlign: 'right',
  },
  linePath: {
    position: 'absolute',
    overflow: 'visible',
  },
  line: {
    height: 2,
    borderTopWidth: 2,
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
