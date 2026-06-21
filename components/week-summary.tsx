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
import { Avatar } from './avatar';
import { useAppTheme } from '@/hooks/use-app-theme';
import { WEEK_SUMMARY_SCORE_STOPS } from '@/constants/Colors';

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
  const { mode, colors } = useAppTheme();
  const animatedCompletion = useSharedValue(weeklyCompletion);

  const donutSize = 120;
  const radius = 52;
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

  const cardBackground = getCardBackgroundColor(weeklyCompletion, mode);

  return (
    <View
        style={[
          styles.container,
          {
            backgroundColor: cardBackground,
            borderColor: colors.cardBorder,
          },
        ]}
      >
      <View style={styles.heroRow}>
        <View style={styles.scoreColumn}>
          <ThemedText
            style={[
              styles.scoreLabel,
              { color: colors.textMuted },
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
                stroke={colors.chartGrid}
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
          <Avatar score={weeklyCompletion} accentColor={accentColor} size="medium" />
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
                  mode === 'dark'
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
                        : colors.textSubtle,
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
                        ? colors.text
                        : (day.completion ?? 0) >= 70
                          ? accentColor
                          : colors.textMuted,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 20,
    gap: 8,
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
    width: 130,
    alignItems: 'center',
    gap: 10,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  donutWrapper: {
    width: 110,
    height: 110,
  },
  mascotColumn: {
    flex: 1,
    minWidth: 180,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  dayItem: {
    width: '12%',
    minWidth: 30,
    alignItems: 'center',
    gap: 2,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 2,
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

function getCardBackgroundColor(score: number, mode: 'dark' | 'light'): string {
  // Find the two closest color stops
  type ScoreStop = (typeof WEEK_SUMMARY_SCORE_STOPS)[number];
  let start: ScoreStop = WEEK_SUMMARY_SCORE_STOPS[0];
  let end: ScoreStop = WEEK_SUMMARY_SCORE_STOPS[WEEK_SUMMARY_SCORE_STOPS.length - 1];

  for (let i = 0; i < WEEK_SUMMARY_SCORE_STOPS.length - 1; i++) {
    if (score >= WEEK_SUMMARY_SCORE_STOPS[i].score && score <= WEEK_SUMMARY_SCORE_STOPS[i + 1].score) {
      start = WEEK_SUMMARY_SCORE_STOPS[i];
      end = WEEK_SUMMARY_SCORE_STOPS[i + 1];
      break;
    }
  }

  // Interpolate between the two colors
  const range = end.score - start.score;
  const progress = (score - start.score) / range;

  const startColor = mode === 'dark' ? start.dark : start.light;
  const endColor = mode === 'dark' ? end.dark : end.light;

  return interpolateColor(startColor, endColor, progress);
}

function interpolateColor(color1: string, color2: string, progress: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * progress);
  const g = Math.round(c1.g + (c2.g - c1.g) * progress);
  const b = Math.round(c1.b + (c2.b - c1.b) * progress);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

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
