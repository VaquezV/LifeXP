import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ActivityIndicator, Pressable } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/avatar';
import { AccessoryIcon } from '@/components/accessory-icon';
import { ACCESSORY_LABELS, getAccessoryTierLabel } from '@/lib/accessoires';
import { fetchHabits } from '@/lib/habits';
import { fetchAllLogsForDate } from '@/lib/habit-logs';
import { calculateWeeklyScore, calculateCategoryCompletion } from '@/lib/scoring';
import { CategoryType, Habit, CATEGORY_KEYS } from '@/lib/types';


const CATEGORY_ACCENT: Record<CategoryType, string> = {
  self_care:     '#4caf50',
  dev_perso:     '#ba68c8',
  vie_familiale: '#ef5350',
  vie_pro:       '#42a5f5',
};

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ProfileScreen() {
  const { colors, styles: themeStyles } = useAppTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weekLogs, setWeekLogs] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      dates.push(toDateKey(d));
    }
    return dates;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const fetchedHabits = await fetchHabits();
        setHabits(fetchedHabits);
        const logs: Record<string, Record<string, number>> = {};
        for (const date of weekDates) {
          logs[date] = await fetchAllLogsForDate(date);
        }
        setWeekLogs(logs);
      } catch (e) {
        console.error('Profile load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [weekDates]);

  const weeklyScore = useMemo(
    () => calculateWeeklyScore(habits, weekLogs),
    [habits, weekLogs]
  );

  const categoryCompletions = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_KEYS.map(cat => [cat, calculateCategoryCompletion(habits, weekLogs, cat)])
      ) as Record<CategoryType, number>,
    [habits, weekLogs]
  );

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

        {/* ── Avatar zone ── */}
        <View style={[styles.avatarZone, { backgroundColor: colors.surface }]}>
          {/* Subtle tint glow */}
          <View style={[styles.avatarGlow, { backgroundColor: colors.tint + '12' }]} />

          <Avatar score={weeklyScore} size="large" />

          {/* XP bar overlay */}
          <View style={styles.xpBarRow}>
            <ThemedText style={[styles.levelLabel, { color: colors.text }]}>
              Semaine en cours
            </ThemedText>
            <ThemedText style={[styles.xpLabel, { color: colors.tint }]}>
              {weeklyScore}%
            </ThemedText>
          </View>
          <View style={[styles.xpTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.xpFill,
                { width: `${weeklyScore}%`, backgroundColor: colors.tint },
              ]}
            />
          </View>
        </View>

        {/* ── 2×2 accessory grid ── */}
        <View style={styles.grid}>
          {CATEGORY_KEYS.map((cat, idx) => {
            const pct = categoryCompletions[cat];
            const accent = CATEGORY_ACCENT[cat];
            const tierLabel = getAccessoryTierLabel(pct);
            const accLabel = ACCESSORY_LABELS[cat];

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
                {/* Accessory icon */}
                <View style={styles.cellIconWrapper}>
                  <AccessoryIcon category={cat} score={pct} size={80} />
                </View>

                {/* Name + progress */}
                <View style={styles.cellMeta}>
                  <View style={styles.cellTitleRow}>
                    <ThemedText style={[styles.cellName, { color: accent }]}>
                      {accLabel}
                    </ThemedText>
                    <ThemedText style={[styles.cellPct, { color: accent }]}>
                      {pct}%
                    </ThemedText>
                  </View>
                  <View style={[styles.cellTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.cellFill,
                        { width: `${pct}%`, backgroundColor: accent },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.cellTier, { color: colors.textSubtle }]}>
                    {tierLabel}
                  </ThemedText>
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
  screen: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 40,
  },
  avatarZone: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 0,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    width: 220,
    height: 220,
    borderRadius: 110,
    alignSelf: 'center',
  },
  xpBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    marginBottom: 6,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  xpTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  xpFill: {
    height: 4,
    borderRadius: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '50%',
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  cellIconWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellMeta: {
    width: '100%',
    gap: 4,
  },
  cellTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cellName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cellPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  cellTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  cellFill: {
    height: 3,
    borderRadius: 2,
  },
  cellTier: {
    fontSize: 9,
  },
});
