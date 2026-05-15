import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { ThemedText } from './themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface WeekDay {
  abbr: string;
  date: string;
  isCompleted?: boolean;
  isToday?: boolean;
}

interface WeekSummaryProps {
  weekDays: WeekDay[];
  weeklyCompletion: number; // 0-100
  accentColor: string;
}

export function WeekSummary({
  weekDays,
  weeklyCompletion,
  accentColor,
}: WeekSummaryProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  const donutSize = 120;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (weeklyCompletion / 100) * circumference;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
      ]}
    >
      {/* Donut Chart */}
      <View style={styles.donutWrapper}>
        <Svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
          {/* Background circle */}
          <Circle
            cx={donutSize / 2}
            cy={donutSize / 2}
            r={radius}
            stroke="#333333"
            strokeWidth={14}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={donutSize / 2}
            cy={donutSize / 2}
            r={radius}
            stroke={accentColor}
            strokeWidth={14}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            originX={donutSize / 2}
            originY={donutSize / 2}
          />
          {/* Center text */}
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

      {/* Day abbreviations and dates grid */}
      <View style={styles.daysGrid}>
        {weekDays.map((day, idx) => (
          <View key={idx} style={styles.dayItem}>
            <ThemedText
              style={[
                styles.dayAbbr,
                {
                  color: day.isCompleted ? accentColor : day.isToday ? accentColor : '#999999',
                },
              ]}
            >
              {day.abbr}
            </ThemedText>
            <ThemedText
              style={[
                styles.dayDate,
                {
                  color: day.isCompleted ? accentColor : day.isToday ? '#ffffff' : '#999999',
                },
              ]}
            >
              {day.date}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  donutWrapper: {
    width: 120,
    height: 120,
    flexShrink: 0,
  },
  daysGrid: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  dayItem: {
    width: '13%',
    alignItems: 'center',
  },
  dayAbbr: {
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  dayDate: {
    fontSize: 12,
    fontWeight: '700',
  },
});
