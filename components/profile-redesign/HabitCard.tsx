import { AccessoryIcon } from '@/components/accessory-icon';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getScoringConfigForLevel } from '@/lib/scoring-config';
import { ensureContrast } from '@/lib/theme-evolution';
import type { CategoryProgress, CategoryType, ScoringConfig } from '@/lib/types';
import { getAccessoryName } from '@/lib/wolf-data';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  self_care: 'ANTRE',
  dev_perso: 'CRI',
  vie_familiale: 'MEUTE',
  vie_pro: 'TOTEM',
};

interface HabitCardProps {
  category: CategoryType;
  categoryProgress: CategoryProgress;
  scoringConfigs: ScoringConfig[];
}

export function HabitCard({
  category,
  categoryProgress,
  scoringConfigs,
}: HabitCardProps) {
  const theme = useWolfLevelTheme();

  const accentColor = ensureContrast(CATEGORY_COLORS[category].mid, theme.surface, 4.5);
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
          backgroundColor: theme.surfaceRaised,
          borderColor: accentColor,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <AccessoryIcon
          category={category}
          level={categoryProgress.current_level}
          size={98}
        />
      </View>

      <View style={styles.contentContainer}>
        <ThemedText style={[styles.categoryLabel, { color: accentColor }]}>
          {CATEGORY_LABELS[category]}
        </ThemedText>
        <ThemedText
          style={[
            styles.cardName,
            { color: theme.text },
          ]}
          numberOfLines={2}
        >
          {cardName}
        </ThemedText>

        <View style={styles.levelIndicator}>
          <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
            <ThemedText style={[styles.levelBadgeText, { color: theme.surface }]}>
              Niv. {categoryProgress.current_level}
            </ThemedText>
          </View>
          <ThemedText
            style={[
              styles.progressLabel,
              { color: theme.textMuted },
            ]}
          >
            {isMaxLevel ? 'TERMINÉ' : ''}
          </ThemedText>
        </View>

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
        <ThemedText style={[styles.progressValue, { color: theme.textMuted }]}>
          {isMaxLevel ? 'Maximum atteint' : `${Math.round(progressRatio * 100)}%`}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 200,
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    gap: 12,
  },
  iconContainer: {
    width: '100%',
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    gap: 8,
  },
  categoryLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'capitalize',
    justifyContent: 'center'
  },
  cardName: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    minHeight: 38,

    justifyContent: 'center'
  },
  levelIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    justifyContent: 'center'
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,

    justifyContent: 'center'
  },
  progressTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  progressValue: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
