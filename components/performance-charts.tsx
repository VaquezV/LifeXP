import React, { useState, useMemo, memo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { LineChart } from './line-chart';
import { Habit } from '@/lib/types';
import { aggregateChartData } from '@/lib/chart-data';

type ViewMode = 'week' | 'month' | 'quarter' | 'year';

export interface PerformanceChartsProps {
  habits: Habit[];
  dailyValues: Record<string, Record<string, number>>;
  allDates: string[];
}

function PerformanceChartsComponent({
  habits,
  dailyValues,
  allDates,
}: PerformanceChartsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const chartData = useMemo(() => {
    return aggregateChartData(habits, dailyValues, viewMode);
  }, [habits, dailyValues, viewMode]);

  return (
    <ScrollView>
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
                {mode === 'week'
                  ? 'Semaine'
                  : mode === 'month'
                    ? 'Mois'
                    : mode === 'quarter'
                      ? 'Trimestre'
                      : 'Année'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Charts */}
        <View>
          <LineChart
            title="Overall Progress"
            data={chartData.global}
            color={isDark ? '#aaaaaa' : '#666666'}
          />
          <LineChart
            title="Self Care"
            data={chartData.self_care}
            color="#2e7d32"
          />
          <LineChart
            title="Personal Dev"
            data={chartData.dev_perso}
            color="#6a1b9a"
          />
          <LineChart
            title="Family Life"
            data={chartData.vie_familiale}
            color="#c62828"
          />
          <LineChart
            title="Professional"
            data={chartData.vie_pro}
            color="#1565c0"
          />
        </View>

        {/* Legend */}
        <View style={styles.legendSection}>
          <View style={styles.legendRow}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: isDark ? '#aaaaaa' : '#666666' },
              ]}
            />
            <ThemedText style={styles.legendText}>Total</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: '#2e7d32' }]}
            />
            <ThemedText style={styles.legendText}>Self Care</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: '#6a1b9a' }]}
            />
            <ThemedText style={styles.legendText}>Personal Dev</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: '#c62828' }]}
            />
            <ThemedText style={styles.legendText}>Family Life</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: '#1565c0' }]}
            />
            <ThemedText style={styles.legendText}>Professional</ThemedText>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

export const PerformanceCharts = memo(PerformanceChartsComponent);

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
  legendSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});
