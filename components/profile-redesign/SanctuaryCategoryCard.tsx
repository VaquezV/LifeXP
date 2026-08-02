// components/profile-redesign/SanctuaryCategoryCard.tsx
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ACCESSORY_LABELS } from '@/lib/accessoires';
import {
  getLockedElements,
  getNextElement,
  getPointsRemainingToElement,
  getPointsRemainingToNextLevel,
  getPointsWithinCurrentLevel,
  getUnlockedElements,
} from '@/lib/category-elements';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getScoringConfigForLevel } from '@/lib/scoring-config';
import { ensureContrast, getReadableTextColor } from '@/lib/theme-evolution';
import type { CategoryProgress, CategoryType, ScoringConfig } from '@/lib/types';
import { getAccessoryName } from '@/lib/wolf-data';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressionElementIcon } from './ProgressionElementIcon';

interface SanctuaryCategoryCardProps {
  category: CategoryType;
  categoryProgress: CategoryProgress;
  scoringConfigs: ScoringConfig[];
}

/** Sanctuaire progression card for one category: level, narrative name, progress bar, and every
 * current-level milestone element (unlocked + locked) via ProgressionElementIcon. Replaces
 * HabitCard on the Sanctuaire page. Called by the Sanctuaire/Profil screen for each of the 4 categories. */
export function SanctuaryCategoryCard({ category, categoryProgress, scoringConfigs }: SanctuaryCategoryCardProps) {
  const theme = useWolfLevelTheme();
  const { current_level: level, points_in_level: pointsInLevel } = categoryProgress;

  const accentColor = ensureContrast(CATEGORY_COLORS[category].mid, theme.surface, 4.5);
  const config = getScoringConfigForLevel(scoringConfigs, level);
  const pointsToNextLevel = config.points_to_next_level;
  const isMaxLevel = level >= 5;

  const levelName = getAccessoryName(category, level);
  const nextLevelName = isMaxLevel ? null : getAccessoryName(category, level + 1);
  const pointsWithinLevel = getPointsWithinCurrentLevel(pointsInLevel, pointsToNextLevel);
  const progressRatio = pointsToNextLevel > 0 ? Math.min(1, pointsWithinLevel / pointsToNextLevel) : 1;

  const unlocked = getUnlockedElements(category, level, pointsInLevel, pointsToNextLevel);
  const locked = getLockedElements(category, level, pointsInLevel, pointsToNextLevel);
  const orderedElements = [...unlocked, ...locked].sort((a, b) => a.order - b.order);
  const unlockedIds = new Set(unlocked.map(e => e.id));

  const nextElement = getNextElement(category, level, pointsInLevel, pointsToNextLevel);
  const pointsToNextElement = getPointsRemainingToElement(category, level, pointsInLevel, pointsToNextLevel);
  const pointsToLevelUp = getPointsRemainingToNextLevel(level, pointsInLevel, pointsToNextLevel);

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceRaised, borderColor: accentColor }]}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.categoryLabel, { color: accentColor }]}>
          {ACCESSORY_LABELS[category].toUpperCase()}
        </ThemedText>
        <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
          <ThemedText style={[styles.levelBadgeText, { color: getReadableTextColor(accentColor) }]}>
            Niv. {level}/5
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.cardName, { color: theme.text }]} numberOfLines={2}>
        {levelName}
      </ThemedText>

      <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
        <View style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%`, backgroundColor: accentColor }]} />
      </View>
      <ThemedText style={[styles.progressValue, { color: theme.textMuted }]}>
        {Math.round(pointsWithinLevel)} / {pointsToNextLevel}
      </ThemedText>

      <View style={styles.elementsRow}>
        {orderedElements.map(element => (
          <ProgressionElementIcon
            key={element.id}
            element={element}
            state={unlockedIds.has(element.id) ? 'unlocked' : 'locked'}
            accentColor={accentColor}
            mutedColor={theme.borderSoft}
          />
        ))}
      </View>

      {nextElement && pointsToNextElement !== null && (
        <ThemedText style={[styles.hintText, { color: theme.textMuted }]}>
          Prochain : {nextElement.label} dans {pointsToNextElement} points
        </ThemedText>
      )}

      {!isMaxLevel && (
        <ThemedText style={[styles.hintText, { color: theme.textMuted }]}>
          Niveau suivant ({nextLevelName}) dans {pointsToLevelUp} points
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '47%', flexGrow: 1, minHeight: 220, borderRadius: 14, borderWidth: 2, padding: 14, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  levelBadgeText: { fontSize: 11, fontWeight: '800' },
  cardName: { fontSize: 14, fontWeight: '700', lineHeight: 18, minHeight: 36 },
  progressTrack: { height: 7, borderRadius: 3.5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3.5 },
  progressValue: { fontSize: 10, fontWeight: '600' },
  elementsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  hintText: { fontSize: 10, fontWeight: '600', lineHeight: 14 },
});
