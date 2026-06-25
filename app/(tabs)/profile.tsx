// app/(tabs)/profile.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/avatar';
import { AccessoryIcon } from '@/components/accessory-icon';
import {
  ACCESSORY_LABELS,
  CATEGORY_CURRENCY_NAMES,
  getAccessoryTierLabel,
  formatPoints,
} from '@/lib/accessoires';
import { CategoryType, CATEGORY_KEYS, ScoringConfig } from '@/lib/types';
import { fetchCategoryProgress, defaultAllCategoryProgress } from '@/lib/category-progress';
import { fetchScoringConfig, getScoringConfigForLevel, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import { getAvatarScoreFromLevels } from '@/lib/avatar-level';
import type { CategoryProgress } from '@/lib/types';

const CATEGORY_ACCENT: Record<CategoryType, string> = {
  self_care:     '#4caf50',
  dev_perso:     '#ba68c8',
  vie_familiale: '#ef5350',
  vie_pro:       '#42a5f5',
};

export default function ProfileScreen() {
  const { colors, styles: themeStyles } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [categoryProgress, setCategoryProgress] = useState<Record<CategoryType, CategoryProgress> | null>(null);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>(SCORING_CONFIG_FALLBACK);

  useEffect(() => {
    const load = async () => {
      try {
        const [progress, configs] = await Promise.all([
          fetchCategoryProgress().catch(() => null),
          fetchScoringConfig().catch(() => SCORING_CONFIG_FALLBACK),
        ]);
        if (progress) setCategoryProgress(progress);
        if (configs.length) setScoringConfigs(configs);
      } catch (e) {
        console.error('Profile load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const progress = categoryProgress ?? defaultAllCategoryProgress('');

  const avatarScore = useMemo(() => {
    const levels = Object.fromEntries(
      CATEGORY_KEYS.map(cat => [cat, progress[cat].current_level])
    ) as Record<CategoryType, number>;
    return getAvatarScoreFromLevels(levels);
  }, [progress]);

  const wolfLevel = useMemo(() => {
    const levels = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
    const labels = ['N1','N1+','N2','N2+','N3','N3+','N4','N4+','N5','N5'];
    const idx = levels.findIndex(l => avatarScore <= l);
    return labels[idx >= 0 ? idx : labels.length - 1];
  }, [avatarScore]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, themeStyles.screen]}>
        <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, themeStyles.screen]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ThemedText style={[styles.headerTitle, { color: colors.tint }]}>Life XP</ThemedText>
        </View>

        {/* Avatar zone */}
        <View style={styles.avatarZone}>
          <Avatar score={avatarScore} size="large" />
          <ThemedText style={[styles.wolfLevelLabel, { color: colors.textMuted }]}>
            Loup · {wolfLevel}
          </ThemedText>
        </View>

        {/* 2x2 accessory grid */}
        <View style={styles.grid}>
          {CATEGORY_KEYS.map((cat, idx) => {
            const catProgress = progress[cat];
            const config = getScoringConfigForLevel(scoringConfigs, catProgress.current_level);
            const accent = CATEGORY_ACCENT[cat];
            const currencyName = CATEGORY_CURRENCY_NAMES[cat];
            const tierLabel = getAccessoryTierLabel(catProgress.current_level);
            const accLabel = ACCESSORY_LABELS[cat];
            const ptsDisplay = formatPoints(catProgress.points_in_level, currencyName);
            const levelDisplay = `N${catProgress.current_level} · ${tierLabel}`;
            const isMaxLevel = catProgress.current_level >= 5;
            const progressRatio = isMaxLevel
              ? 1
              : Math.min(1, catProgress.points_in_level / config.points_to_next_level);

            return (
              <View
                key={cat}
                style={[
                  styles.gridCell,
                  {
                    borderRightWidth: idx % 2 === 0 ? 1 : 0,
                    borderBottomWidth: idx < 2 ? 1 : 0,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <View style={styles.cellIconWrapper}>
                  <AccessoryIcon
                    category={cat}
                    level={catProgress.current_level}
                    size={80}
                  />
                </View>

                <View style={styles.cellMeta}>
                  <ThemedText style={[styles.cellName, { color: accent }]}>
                    {accLabel}
                  </ThemedText>
                  <ThemedText style={[styles.cellPts, { color: accent }]}>
                    {ptsDisplay}
                  </ThemedText>
                  <ThemedText style={[styles.cellTier, { color: colors.textSubtle }]}>
                    {levelDisplay}
                  </ThemedText>

                  {/* Barre de progression vers niveau suivant */}
                  <View style={styles.progressBlock}>
                    <ThemedText style={[styles.progressLabel, { color: colors.textSubtle }]}>
                      {isMaxLevel ? 'Niveau max' : 'Niveau suivant'}
                    </ThemedText>
                    <View style={styles.progressRow}>
                      <ThemedText style={[styles.progressNum, { color: colors.textSubtle }]}>0</ThemedText>
                      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${Math.round(progressRatio * 100)}%`, backgroundColor: accent },
                          ]}
                        />
                      </View>
                      <ThemedText style={[styles.progressNum, { color: colors.textSubtle }]}>
                        {isMaxLevel ? '—' : `${config.points_to_next_level} pts`}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarZone: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  wolfLevelLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: '50%', padding: 16, alignItems: 'center', gap: 10 },
  cellIconWrapper: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  cellMeta: { width: '100%', gap: 3, alignItems: 'center' },
  cellName: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  cellPts: { fontSize: 12, fontWeight: '700' },
  cellTier: { fontSize: 9 },
  progressBlock: { width: '100%', gap: 3, marginTop: 6 },
  progressLabel: { fontSize: 8, letterSpacing: 0.4, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressNum: { fontSize: 8, minWidth: 24, textAlign: 'center' },
});
