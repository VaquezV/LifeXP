// components/hero-banner.tsx
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useThemeContext } from '@/lib/theme-context';
import { ThemedText } from './themed-text';
import { Avatar } from './avatar';
import { getWolfQuote } from '@/lib/accessoires';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface WeekDay {
  abbr: string;
  date: string;
  completion?: number;
  isToday?: boolean;
}

interface HeroBannerProps {
  avatarScore: number;
  weekDays: WeekDay[];
}

function computeStreak(days: WeekDay[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if ((days[i].completion ?? 0) > 0) streak++;
    else break;
  }
  return streak;
}

export function HeroBanner({ avatarScore, weekDays }: HeroBannerProps) {
  const { colors, isDark } = useAppTheme();
  const { toggleTheme } = useThemeContext();
  const streak = computeStreak(weekDays);
  const quote = getWolfQuote(avatarScore);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <ThemedText style={styles.appTitle}>LifeXP</ThemedText>
        <TouchableOpacity onPress={toggleTheme} hitSlop={8} accessibilityRole="button">
          <MaterialIcons
            name={isDark ? 'wb-sunny' : 'brightness-3'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.wolfRow}>
        <View style={styles.avatarCircle}>
          <Avatar score={avatarScore} size="small" />
        </View>
        <View style={styles.scoreBlock}>
          {streak > 0 && (
            <ThemedText style={[styles.streakText, { color: colors.tint }]}>
              🔥 {streak} jour{streak > 1 ? 's' : ''} d'affilée
            </ThemedText>
          )}
        </View>
      </View>

      <View style={[styles.quoteBox, { borderLeftColor: colors.tint + '55', backgroundColor: colors.tint + '0a' }]}>
        <ThemedText style={[styles.quoteText, { color: colors.textMuted }]}>
          "{quote}"
        </ThemedText>
      </View>

      <View style={styles.weekStrip}>
        {weekDays.map((day, idx) => {
          const done = (day.completion ?? 0) > 0;
          return (
            <View
              key={idx}
              style={[
                styles.dayChip,
                {
                  backgroundColor: day.isToday
                    ? colors.tint + '15'
                    : done
                      ? colors.tint + '12'
                      : colors.surfaceMuted,
                  borderColor: day.isToday ? colors.tint + '66' : 'transparent',
                  borderWidth: day.isToday ? 1 : 0,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.dayLabel,
                  {
                    color: day.isToday
                      ? colors.tint
                      : done
                        ? colors.tint + 'aa'
                        : colors.textSubtle,
                  },
                ]}
              >
                {day.abbr}
              </ThemedText>
              <View
                style={[
                  styles.dayPip,
                  {
                    backgroundColor: day.isToday ? colors.tint : done ? colors.tint : colors.border,
                    opacity: done || day.isToday ? 1 : 0.3,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  wolfRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scoreBlock: { flex: 1, gap: 2 },
  streakText: { fontSize: 12, fontWeight: '600' },
  quoteBox: { borderLeftWidth: 2, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 },
  quoteText: { fontSize: 11, fontStyle: 'italic', lineHeight: 16 },
  weekStrip: { flexDirection: 'row', gap: 4 },
  dayChip: { flex: 1, borderRadius: 6, paddingVertical: 5, alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.3 },
  dayPip: { width: 5, height: 5, borderRadius: 3 },
});
