import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WeeklyMascot } from './weekly-mascot';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WeekDay {
  abbr: string;
  date: string;
  completion?: number;
  isToday?: boolean;
}

interface WeekSummaryProps {
  weekDays: WeekDay[];
  weeklyCompletion: number;
  accentColor: string;
}

export function WeekSummary({
  weekDays,
  weeklyCompletion,
  accentColor,
}: WeekSummaryProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const animatedCompletion = useSharedValue(weeklyCompletion);

  const donutSize = 120;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    animatedCompletion.value = withTiming(weeklyCompletion, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedCompletion, weeklyCompletion]);

  const progressCircleProps = useAnimatedProps(() => ({
    strokeDashoffset:
      circumference - (animatedCompletion.value / 100) * circumference,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#101416' : '#f3f7f6',
          borderColor: isDark ? '#1d262b' : '#dce8e4',
        },
      ]}
    >
      <View style={styles.heroRow}>
        <View style={styles.scoreColumn}>
          <ThemedText
            style={[
              styles.scoreLabel,
              { color: isDark ? '#95a9ad' : '#587275' },
            ]}
          >
            SCORE SEMAINE
          </ThemedText>
          <View style={styles.donutWrapper}>
            <Svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
              <Circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                stroke={isDark ? '#223038' : '#d8e5e2'}
                strokeWidth={14}
                fill="none"
              />
              <AnimatedCircle
                animatedProps={progressCircleProps}
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                stroke={accentColor}
                strokeWidth={14}
                fill="none"
                strokeDasharray={circumference}
                strokeLinecap="round"
                rotation={-90}
                originX={donutSize / 2}
                originY={donutSize / 2}
              />
              <SvgText
                x={donutSize / 2}
                y={donutSize / 2 + 8}
                textAnchor="middle"
                fontSize={28}
                fontWeight="bold"
                fill={accentColor}
              >
                {weeklyCompletion}%
              </SvgText>
            </Svg>
          </View>
        </View>

        <View style={styles.mascotColumn}>
          <WeeklyMascot score={weeklyCompletion} accentColor={accentColor} />
        </View>
      </View>

      <View style={styles.daysGrid}>
        {weekDays.map((day, idx) => (
          <View
            key={idx}
            style={[
              styles.dayItem,
              {
                backgroundColor: getCompletionBackground(
                  accentColor,
                  day.completion ?? 0,
                  isDark
                ),
                borderColor: day.isToday ? accentColor : 'transparent',
              },
            ]}
          >
            <ThemedText
              style={[
                styles.dayAbbr,
                {
                  color:
                    day.isToday || (day.completion ?? 0) > 0
                      ? accentColor
                      : isDark
                        ? '#74828a'
                        : '#8b9b9f',
                },
              ]}
            >
              {day.abbr}
            </ThemedText>
            <ThemedText
              style={[
                styles.dayDate,
                {
                  color:
                    day.isToday
                      ? isDark
                        ? '#ffffff'
                        : '#081217'
                      : (day.completion ?? 0) >= 70
                        ? accentColor
                        : isDark
                          ? '#d7dfe2'
                          : '#304548',
                },
              ]}
            >
              {day.date}
            </ThemedText>
            <View
              style={[
                styles.dayMeter,
                {
                  width: `${Math.max(12, day.completion ?? 0)}%`,
                  backgroundColor: accentColor,
                  opacity: (day.completion ?? 0) > 0 ? 1 : 0.28,
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
  },
  scoreColumn: {
    width: 128,
    alignItems: 'center',
    gap: 10,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  donutWrapper: {
    width: 120,
    height: 120,
  },
  mascotColumn: {
    flex: 1,
    minWidth: 180,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  dayItem: {
    width: '13.4%',
    minWidth: 40,
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  dayAbbr: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayMeter: {
    height: 3,
    borderRadius: 999,
    alignSelf: 'stretch',
    minWidth: 10,
  },
});

function getCompletionBackground(
  accentColor: string,
  completion: number,
  isDark: boolean
): string {
  const alpha = isDark
    ? 0.08 + (completion / 100) * 0.22
    : 0.06 + (completion / 100) * 0.16;
  return hexToRgba(accentColor, alpha);
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map(char => char + char)
          .join('')
      : normalized;

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
