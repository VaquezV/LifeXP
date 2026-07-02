import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AccessoryIcon } from '@/components/accessory-icon';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getAccessoryName } from '@/lib/wolf-data';
import { getScoringConfigForLevel } from '@/lib/scoring-config';
import type { CategoryProgress, CategoryType, ScoringConfig } from '@/lib/types';

interface HabitCardProps {
  category: CategoryType;
  categoryProgress: CategoryProgress;
  scoringConfigs: ScoringConfig[];
}

// Color mapping per category
const CATEGORY_COLORS: Record<CategoryType, string> = {
  self_care: '#6aaa6a', // green
  dev_perso: '#f5a840', // orange
  vie_familiale: '#e8b8a0', // salmon/orange
  vie_pro: '#7c9fd9', // blue
};

export function HabitCard({
  category,
  categoryProgress,
  scoringConfigs,
}: HabitCardProps) {
  const theme = useWolfLevelTheme();

  const accentColor = CATEGORY_COLORS[category];
  const cardName = getAccessoryName(category, categoryProgress.current_level);
  const config = getScoringConfigForLevel(scoringConfigs, categoryProgress.current_level);
  const isMaxLevel = categoryProgress.current_level >= 5;
  const progressRatio = isMaxLevel
    ? 1
    : Math.min(1, categoryProgress.points_in_level / config.points_to_next_level);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderLeftColor: accentColor,
        },
      ]}
    >
      {/* Icon (left side) */}
      <View style={styles.iconContainer}>
        <AccessoryIcon
          category={category}
          level={categoryProgress.current_level}
          size={50}
        />
      </View>

      {/* Content (right side) */}
      <View style={styles.contentContainer}>
        {/* Card Name */}
        <ThemedText
          style={[
            styles.cardName,
            { color: theme.text },
          ]}
          numberOfLines={1}
        >
          {cardName}
        </ThemedText>

        {/* Meta Row: Level | Points */}
        <View style={styles.metaRow}>
          <ThemedText
            style={[
              styles.metaLabel,
              { color: theme.textMuted },
            ]}
          >
            Niv. {categoryProgress.current_level}
          </ThemedText>
          <ThemedText
            style={[
              styles.metaLabel,
              { color: theme.textMuted },
            ]}
          >
            {isMaxLevel ? 'MAX!' : `${categoryProgress.points_in_level}/${config.points_to_next_level}`}
          </ThemedText>
        </View>

        {/* Progress Bar */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.borderSoft },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progressRatio * 100)}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 16,
    gap: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    gap: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
