import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { LineChart } from './line-chart';
import { Habit } from '@/lib/types';
import { aggregateChartData, ChartData } from '@/lib/chart-data';

type ViewMode = 'week' | 'month' | 'quarter' | 'year';

export interface DashboardViewProps {
  habits: Habit[];
  dailyValues: Record<string, Record<string, number>>;
}

export function DashboardView({ habits, dailyValues }: DashboardViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const chartData = useMemo(() => {
    return aggregateChartData(habits, dailyValues, viewMode);
  }, [habits, dailyValues, viewMode]);

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
              {mode === 'week'
                ? '2W'
                : mode === 'month'
                  ? '2M'
                  : mode === 'quarter'
                    ? '3M'
                    : '12M'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chartScroll}
      >
        <LineChart
          data={chartData}
          showGlobal={true}
          showCategories={true}
        />
      </ScrollView>

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
  chartScroll: {
    marginHorizontal: -16,
    marginBottom: 16,
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
