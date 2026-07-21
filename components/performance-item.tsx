import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ensureContrast } from '@/lib/theme-evolution';
import type { CategoryType, Habit } from '@/lib/types';

export interface PerformanceItemProps {
  habit: Habit;
  performanceData: Record<number, number>; // slotIndex -> percentage (0-100)
}

export function PerformanceItem({
  habit,
  performanceData,
}: PerformanceItemProps) {
  const theme = useWolfLevelTheme();
  const categoryColor = CATEGORY_COLORS[habit.category as CategoryType];
  const accentColor = ensureContrast(categoryColor.mid, theme.surface, 4.5);

  const getColorWithTransparency = (percentage: number): string => {
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const opacity = 0.15 + (Math.max(0, percentage) / 100) * 0.85;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const gridSquares = Object.entries(performanceData)
    .map(([slotStr, percentage]) => ({
      slot: parseInt(slotStr),
      percentage,
    }))
    .sort((a, b) => a.slot - b.slot);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
        <ThemedText
          style={[styles.habitTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {habit.name}
        </ThemedText>
      </View>

      <View
        style={[
          styles.performanceGrid,
          { gap: 1 },
        ]}
      >
        {gridSquares.map((square) => (
          <View
            key={square.slot}
            style={[
              styles.performanceSquare,
              {
                width: 8,
                height: 8,
                backgroundColor: square.percentage === 0 ? 'transparent' : getColorWithTransparency(square.percentage),
                borderColor: `${accentColor}40`,
                borderWidth: 0.5,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  performanceSquare: {
    borderRadius: 1,
  },
});
