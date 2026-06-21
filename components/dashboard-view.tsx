import React, { useState, useMemo, memo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { LineChart } from './line-chart';
import { Habit } from '@/lib/types';
import { aggregateChartData } from '@/lib/chart-data';
import { useAppTheme } from '@/hooks/use-app-theme';
import { CATEGORY_COLORS } from '@/constants/Colors';

type ViewMode = 'week' | 'month' | 'year';

export interface DashboardViewProps {
  habits: Habit[];
  dailyValues: Record<string, Record<string, number>>;
}

function DashboardViewComponent({ habits, dailyValues }: DashboardViewProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const chartData = useMemo(() => {
    return aggregateChartData(habits, dailyValues, viewMode);
  }, [habits, dailyValues, viewMode]);

  return (
    <ScrollView>
      <ThemedView
        style={[
          styles.container,
          themeStyles.surface,
        ]}
      >
        <View style={styles.header}>
          <ThemedText
            style={[styles.title, { color: colors.text }]}
          >
            Performance
          </ThemedText>
        </View>

        {/* View Mode Selector */}
        <View style={styles.modeSelector}>
          {(['week', 'month', 'year'] as const).map((mode) => (
            <Pressable
              key={mode}
              style={[
                styles.modeButton,
                viewMode === mode
                  ? { backgroundColor: colors.tint, borderColor: colors.tint }
                  : { borderColor: colors.borderSoft, borderWidth: 1 },
              ]}
              onPress={() => setViewMode(mode)}
            >
              <ThemedText
                style={[
                  styles.modeButtonText,
                  { color: viewMode === mode ? colors.onPrimary : colors.textMuted },
                ]}
              >
                {mode === 'week' ? 'Semaine' : mode === 'month' ? 'Mois' : 'Année'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Charts */}
        <View>
          <LineChart
            title="Overall Progress"
            data={chartData.global}
            color={colors.textMuted}
          />
          <LineChart
            title="Self Care"
            data={chartData.self_care}
            color={CATEGORY_COLORS.self_care.mid}
          />
          <LineChart
            title="Personal Dev"
            data={chartData.dev_perso}
            color={CATEGORY_COLORS.dev_perso.mid}
          />
          <LineChart
            title="Family Life"
            data={chartData.vie_familiale}
            color={CATEGORY_COLORS.vie_familiale.mid}
          />
          <LineChart
            title="Professional"
            data={chartData.vie_pro}
            color={CATEGORY_COLORS.vie_pro.mid}
          />
        </View>

        {/* Legend */}
        <View style={[styles.legendSection, themeStyles.dividerTop]}>
          <View style={styles.legendRow}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.textMuted },
              ]}
            />
            <ThemedText style={styles.legendText}>Total</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS.self_care.mid }]}
            />
            <ThemedText style={styles.legendText}>Self Care</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS.dev_perso.mid }]}
            />
            <ThemedText style={styles.legendText}>Personal Dev</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS.vie_familiale.mid }]}
            />
            <ThemedText style={styles.legendText}>Family Life</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS.vie_pro.mid }]}
            />
            <ThemedText style={styles.legendText}>Professional</ThemedText>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

export const DashboardView = memo(DashboardViewComponent);

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
