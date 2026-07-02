import React from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/avatar';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import type { CategoryProgress, CategoryType } from '@/lib/types';
import { getScoringConfigForLevel } from '@/lib/scoring-config';
import type { ScoringConfig } from '@/lib/types';

interface ProfileHeaderProps {
  avatarScore: number;
  wolfName: string;
  wolfClass: string;
  tierIndex: number;
  totalXP: number;
  onEditName: () => void;
  onHelpPress: () => void;
  categoryProgress: Record<CategoryType, CategoryProgress>;
  scoringConfigs: ScoringConfig[];
}

export function ProfileHeader({
  avatarScore,
  wolfName,
  wolfClass,
  tierIndex,
  totalXP,
  onEditName,
  onHelpPress,
  categoryProgress,
  scoringConfigs,
}: ProfileHeaderProps) {
  const theme = useWolfLevelTheme();

  // Calculate level progress
  const currentLevelXP = Object.values(categoryProgress).reduce((sum, cat) => {
    const config = getScoringConfigForLevel(scoringConfigs, cat.current_level);
    return sum + Math.min(cat.points_in_level, config.points_to_next_level);
  }, 0);

  const maxLevelXP = scoringConfigs.reduce((sum, cfg) => sum + cfg.points_to_next_level, 0);
  const progressRatio = maxLevelXP > 0 ? currentLevelXP / maxLevelXP : 0;

  const filled = tierIndex + 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Avatar */}
      <View style={[styles.avatarContainer, { width: 140, height: 140 }]}>
        <Avatar score={avatarScore} size="small" accentColor={theme.tint} />
      </View>

      {/* Name and Title Section */}
      <TouchableOpacity onPress={onEditName} activeOpacity={0.7}>
        <ThemedText style={[styles.wolfName, { color: theme.textStrong || '#ffffff', letterSpacing: -0.5 }]}>
          {wolfName}
        </ThemedText>
      </TouchableOpacity>

      <ThemedText
        style={[
          styles.wolfTitle,
          { color: theme.tint, letterSpacing: 0.5, fontWeight: '600' },
        ]}
      >
        {wolfClass.toUpperCase()}
      </ThemedText>

      {/* Level Section */}
      <View
        style={[
          styles.levelSection,
          {
            backgroundColor: theme.tintSoft + '0a',
            borderLeftColor: theme.tint,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.levelLabel,
            { color: theme.textSubtle || theme.textMuted, letterSpacing: 0.5, fontWeight: '700' },
          ]}
        >
          LEVEL
        </ThemedText>

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
                backgroundColor: theme.tint,
              },
            ]}
          />
        </View>

        {/* Level Numbers */}
        <View style={styles.levelNumbers}>
          {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
            <ThemedText
              key={n}
              style={[
                styles.levelNum,
                { color: n <= filled ? theme.tint : (theme.textSubtle || theme.textMuted), fontWeight: n <= filled ? '700' : '500' },
              ]}
            >
              {n}
            </ThemedText>
          ))}
        </View>

        {/* XP Display */}
        <ThemedText
          style={[
            styles.xpText,
            { color: theme.text, letterSpacing: 0.3, fontWeight: '600' },
          ]}
        >
          {totalXP} XP
        </ThemedText>
      </View>

      {/* Help Button */}
      <Pressable
        onPress={onHelpPress}
        style={[styles.helpButton, { backgroundColor: theme.tintSoft + '15' }]}
        android_ripple={{ color: theme.tint + '30' }}
      >
        <ThemedText
          style={[
            styles.helpIcon,
            { color: theme.tint, fontSize: 20, fontWeight: '600' },
          ]}
        >
          ?
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  wolfName: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  wolfTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  levelSection: {
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    width: '100%',
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelNum: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  helpButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
