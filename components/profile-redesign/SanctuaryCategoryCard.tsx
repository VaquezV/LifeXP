import { AccessoryIcon } from '@/components/accessory-icon';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ACCESSORY_LABELS, getAccessoryName } from '@/lib/category-elements-config';
import {
  getLockedElements,
  getElementThresholds,
  getPointsRemainingToElement,
  getPointsWithinCurrentLevel,
  getUnlockedElements,
} from '@/lib/category-elements';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getScoringConfigForLevel } from '@/lib/scoring-config';
import { ensureContrast, getReadableTextColor } from '@/lib/theme-evolution';
import type { CategoryProgress, CategoryType, ScoringConfig } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CategoryEvolutionModal } from './CategoryEvolutionModal';
import { ProgressionElementIcon } from './ProgressionElementIcon';

interface SanctuaryCategoryCardProps {
  category: CategoryType;
  categoryProgress: CategoryProgress;
  scoringConfigs: ScoringConfig[];
}

/** Full-width Sanctuaire section: the earned milestones form a readable vertical
 * path while the category avatar shows the present state at a glance. */
export function SanctuaryCategoryCard({ category, categoryProgress, scoringConfigs }: SanctuaryCategoryCardProps) {
  const theme = useWolfLevelTheme();
  const [evolutionVisible, setEvolutionVisible] = useState(false);
  const { current_level: level, points_in_level: pointsInLevel } = categoryProgress;

  const accentColor = ensureContrast(CATEGORY_COLORS[category].mid, theme.surface, 4.5);
  const isLevelZero = level === 0;
  const isMaxLevel = level >= 5;
  const targetLevel = level + 1;
  const config = isMaxLevel ? null : getScoringConfigForLevel(scoringConfigs, targetLevel);
  const pointsToNextLevel = config?.points_to_next_level ?? 0;
  const currentName = getAccessoryName(category, level);
  const pointsWithinLevel = getPointsWithinCurrentLevel(pointsInLevel, pointsToNextLevel);
  const progressRatio = pointsToNextLevel > 0 ? Math.min(1, pointsWithinLevel / pointsToNextLevel) : 1;

  const unlocked = isMaxLevel ? [] : getUnlockedElements(category, targetLevel, pointsInLevel, pointsToNextLevel);
  const locked = isMaxLevel ? [] : getLockedElements(category, targetLevel, pointsInLevel, pointsToNextLevel);
  const orderedElements = [...unlocked, ...locked].sort((a, b) => a.order - b.order);
  // The visual column grows upward: the final unlock sits at the top while
  // unlock thresholds and progression logic keep their natural order.
  const displayedElements = [...orderedElements].reverse();
  const unlockedIds = new Set(unlocked.map(e => e.id));
  const elementThresholds = getElementThresholds(pointsToNextLevel, orderedElements.length);
  const pointsToNextElement = isMaxLevel ? null : getPointsRemainingToElement(category, targetLevel, pointsInLevel, pointsToNextLevel);

  return (
    <>
      <View style={[styles.card, { backgroundColor: theme.surfaceRaised, borderColor: accentColor }]}>
        <View style={styles.cardContent}>
          <View style={[styles.categoryHeader, isLevelZero && styles.levelZeroHeader]}>
            {!isLevelZero && (
              <ThemedText style={[styles.categoryLabel, { color: accentColor }]}>
                {ACCESSORY_LABELS[category].toUpperCase()}
              </ThemedText>
            )}
            <View style={[styles.levelBadge, { backgroundColor: accentColor }]}>
              <ThemedText style={[styles.levelBadgeText, { color: getReadableTextColor(accentColor) }]}>Niv. {level}/5</ThemedText>
            </View>
          </View>
          {!isLevelZero && <ThemedText style={[styles.currentName, { color: theme.text }]}>{currentName}</ThemedText>}

          {isMaxLevel ? (
            <View style={styles.maxCategoryPanel}>
              <AccessoryIcon category={category} level={level} size={210} />
            </View>
          ) : (
            <>
              <View style={[styles.columns, isLevelZero && styles.levelZeroColumns]}>
                {!isLevelZero && (
                  <View style={[styles.currentPanel, { borderRightColor: theme.border }]}>
                    <AccessoryIcon category={category} level={level} size={148} />
                  </View>
                )}

                <View style={[styles.stepsPanel, isLevelZero && styles.levelZeroStepsPanel]}>
                  <View style={styles.elementsColumn}>
                    {displayedElements.map(element => {
                      const unlockedElement = unlockedIds.has(element.id);
                      return (
                        <View key={element.id} style={styles.elementRow}>
                          <View style={[styles.elementIconFrame, { borderColor: unlockedElement ? accentColor : theme.borderSoft }]}>
                            <ProgressionElementIcon
                              element={element}
                              state={unlockedElement ? 'unlocked' : 'locked'}
                              accentColor={accentColor}
                              mutedColor={theme.borderSoft}
                              size={32}
                            />
                          </View>
                          <ThemedText
                            style={[styles.elementName, { color: unlockedElement ? theme.text : theme.textMuted }]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {element.label}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
                  <View style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%`, backgroundColor: accentColor }]} />
                  {elementThresholds.map((threshold, index) => (
                    <View
                      key={`${category}-${targetLevel}-threshold-${index}`}
                      pointerEvents="none"
                      accessibilityLabel={`Déblocage de ${orderedElements[index].label} à ${threshold} points`}
                      style={[
                        styles.progressMarker,
                        { left: `${pointsToNextLevel > 0 ? (threshold / pointsToNextLevel) * 100 : 0}%`, backgroundColor: theme.surfaceRaised },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.progressDetails}>
                  <ThemedText style={[styles.progressValue, { color: theme.textMuted }]}>
                    {Math.round(pointsWithinLevel)} / {pointsToNextLevel} points
                  </ThemedText>
                  {pointsToNextElement !== null && (
                    <ThemedText style={[styles.hintText, { color: theme.textMuted }]}>Prochain accessoire dans {pointsToNextElement} points</ThemedText>
                  )}
                </View>
              </View>
            </>
          )}
        </View>

        {!isMaxLevel && (
          <Pressable
            onPress={() => setEvolutionVisible(true)}
            style={[styles.evolutionButton, { borderLeftColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={`Voir la prochaine évolution de ${ACCESSORY_LABELS[category]}`}
          >
            <MaterialIcons name="chevron-right" size={30} color={accentColor} />
          </Pressable>
        )}
      </View>

      {!isMaxLevel && (
        <CategoryEvolutionModal
          category={category}
          currentLevel={level}
          visible={evolutionVisible}
          onClose={() => setEvolutionVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  cardContent: { flex: 1, paddingTop: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16 },
  levelZeroHeader: { justifyContent: 'flex-end' },
  columns: { flexDirection: 'row', minHeight: 160, marginTop: 8 },
  levelZeroColumns: { minHeight: 0 },
  stepsPanel: { flex: 2, paddingLeft: 24, paddingRight: 10, paddingVertical: 16, justifyContent: 'center' },
  levelZeroStepsPanel: { paddingHorizontal: 16 },
  categoryLabel: { fontSize: 18, fontWeight: '900', letterSpacing: 0.8 },
  levelBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  levelBadgeText: { fontSize: 11, fontWeight: '900' },
  elementsColumn: { gap: 6 },
  elementRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 42 },
  elementIconFrame: { width: 42, height: 42, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  elementName: { width: 88, flexGrow: 0, flexShrink: 1, fontSize: 10, lineHeight: 13, fontWeight: '700' },
  progressSection: { paddingHorizontal: 16, paddingBottom: 14, gap: 5 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressMarker: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, opacity: 0.9 },
  progressDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  progressValue: { fontSize: 10, fontWeight: '700' },
  hintText: { fontSize: 10, lineHeight: 14, fontWeight: '600' },
  currentPanel: { flex: 1, minWidth: 140, borderRightWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  maxCategoryPanel: { minHeight: 240, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  currentName: { paddingHorizontal: 16, marginTop: 4, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  evolutionButton: { width: 38, borderLeftWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
