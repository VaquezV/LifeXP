import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { CATEGORY_CURRENCY_NAMES } from '@/lib/category-elements-config';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getNextLevelText, getNextWolfTierScore, getOverallLevelProgress } from '@/lib/wolf-data';
import type { CategoryProgress, CategoryType } from '@/lib/types';
import { CATEGORY_KEYS } from '@/lib/types';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WolfEvolutionModal } from './WolfEvolutionModal';

interface ProfileHeaderProps {
  avatarScore: number;
  wolfName: string;
  wolfClass: string;
  tierIndex: number;
  totalXP: number;
  nextClass: string | null;
  categoryProgress: Record<CategoryType, CategoryProgress>;
  onEditName: () => void;
}

export function ProfileHeader({
  avatarScore,
  wolfName,
  wolfClass,
  tierIndex,
  totalXP,
  nextClass,
  categoryProgress,
  onEditName,
}: ProfileHeaderProps) {
  const theme = useWolfLevelTheme();
  const [evolutionVisible, setEvolutionVisible] = useState(false);

  const overallProgress = getOverallLevelProgress(avatarScore);
  const level = tierIndex + 1;
  const levels = useMemo(
    () => Object.fromEntries(CATEGORY_KEYS.map(category => [category, categoryProgress[category].current_level])) as Record<CategoryType, number>,
    [categoryProgress]
  );
  const nextAvatarScore = getNextWolfTierScore(avatarScore);
  const requirements = useMemo(() => {
    const nextLevelText = getNextLevelText(avatarScore, levels);
    return nextLevelText === '—' ? [] : nextLevelText.split(', ');
  }, [avatarScore, levels]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.surfaceRaised,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.identityRow}>
          <View style={styles.avatarContainer}>
            <Avatar score={avatarScore} size="medium" accentColor={theme.tint} />
          </View>

          <View style={styles.identityContent}>
            <TouchableOpacity onPress={onEditName} activeOpacity={0.7}>
              <ThemedText style={[styles.wolfName, { color: theme.text }]}>
                {wolfName}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.wolfTitle, { color: theme.tint }]}>
              {wolfClass.toUpperCase()}
            </ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.statGroup}>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>NIVEAU</ThemedText>
                <ThemedText style={[styles.statValue, { color: theme.text }]}>{level}</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statGroup}>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>POINTS</ThemedText>
                <ThemedText style={[styles.statValue, { color: theme.tint }]}>{totalXP}</ThemedText>
              </View>
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressLabel}>
                <ThemedText style={[styles.progressText, { color: theme.textMuted }]}>PROGRESSION</ThemedText>
                <ThemedText style={[styles.progressPercent, { color: theme.tint }]}>
                  {Math.round(overallProgress * 100)}%
                </ThemedText>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.borderSoft }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(overallProgress * 100)}%`, backgroundColor: theme.tint },
                  ]}
                />
              </View>
            </View>
            {nextClass && nextAvatarScore !== null && (
              <Pressable
                onPress={() => setEvolutionVisible(true)}
                style={[styles.nextClassBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
                accessibilityRole="button"
                accessibilityLabel={`Voir les conditions pour devenir ${nextClass}`}
              >
                <View style={styles.nextClassCopy}>
                  <ThemedText style={[styles.nextClassLabel, { color: theme.tint }]}>PROCHAIN AVATAR</ThemedText>
                  <ThemedText style={[styles.nextClassName, { color: theme.text }]}>{nextClass}</ThemedText>
                  <ThemedText style={[styles.nextClassAction, { color: theme.textMuted }]}>Voir l’avatar et les conditions</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={28} color={theme.tint} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.overview, { borderTopColor: theme.border }]}>
          <View style={styles.overviewGrid}>
            {CATEGORY_KEYS.map(category => {
              const accent = CATEGORY_COLORS[category].mid;
              const points = Math.max(0, Math.round(categoryProgress[category].points_in_level));
              return (
                <View key={category} style={styles.overviewItem}>
                  <View style={styles.overviewMetric}>
                    <View style={[styles.overviewDot, { backgroundColor: accent }]} />
                    <ThemedText style={[styles.overviewPoints, { color: theme.text }]}>{points}</ThemedText>
                  </View>
                  <ThemedText style={[styles.overviewCurrency, { color: theme.textMuted }]}>{CATEGORY_CURRENCY_NAMES[category]}</ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {nextClass && nextAvatarScore !== null && (
        <WolfEvolutionModal
          visible={evolutionVisible}
          nextClass={nextClass}
          nextAvatarScore={nextAvatarScore}
          requirements={requirements}
          onClose={() => setEvolutionVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: {
    width: 142,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  identityContent: { flex: 1, gap: 12 },
  wolfName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  wolfTitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  statGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  statDivider: {
    width: 1,
    height: 32,
    opacity: 0.2,
  },
  progressSection: { gap: 6 },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
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
  nextClassBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  nextClassCopy: { flex: 1, gap: 3 },
  nextClassLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  nextClassName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  nextClassAction: { fontSize: 10, lineHeight: 14, fontWeight: '600' },
  overview: { marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  overviewGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  overviewItem: { flex: 1, minWidth: 0, gap: 2 },
  overviewMetric: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  overviewDot: { width: 8, height: 8, borderRadius: 4 },
  overviewPoints: { fontSize: 18, lineHeight: 21, fontWeight: '900' },
  overviewCurrency: { fontSize: 9, lineHeight: 12, fontWeight: '700' },
});
