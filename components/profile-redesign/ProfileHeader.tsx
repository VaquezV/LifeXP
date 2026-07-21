import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getOverallLevelProgress } from '@/lib/wolf-data';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProfileHeaderProps {
  avatarScore: number;
  wolfName: string;
  wolfClass: string;
  tierIndex: number;
  totalXP: number;
  nextClass: string | null;
  onEditName: () => void;
}

export function ProfileHeader({
  avatarScore,
  wolfName,
  wolfClass,
  tierIndex,
  totalXP,
  nextClass,
  onEditName,
}: ProfileHeaderProps) {
  const theme = useWolfLevelTheme();

  const overallProgress = getOverallLevelProgress(avatarScore);
  const level = tierIndex + 1;

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
            {nextClass && (
              <View style={[styles.nextClassBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ThemedText style={[styles.nextClassLabel, { color: theme.textMuted }]}>PROCHAINE ÉTAPE</ThemedText>
                <ThemedText style={[styles.nextClassName, { color: theme.text }]}>{nextClass}</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
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
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
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
});
