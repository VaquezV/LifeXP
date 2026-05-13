import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from './themed-text';
import { getGradientColor } from '@/constants/theme';
import { CategoryType } from '@/lib/types';

export interface DayData {
  date: string; // YYYY-MM-DD format
  dayName: string; // e.g., "lun", "mar", etc.
  completion: number; // 0-100 percentage
  category: CategoryType;
}

export interface WeekHeaderProps {
  days: DayData[];
  onDayPress?: (dayData: DayData) => void;
}

export function WeekHeader({ days, onDayPress }: WeekHeaderProps) {
  const handleDayPress = (dayData: DayData) => {
    if (onDayPress) {
      onDayPress(dayData);
    }
  };

  // Extract day number from date string (YYYY-MM-DD -> DD)
  const getDayNumber = (dateString: string): string => {
    const parts = dateString.split('-');
    return parts[2] || '';
  };

  return (
    <View style={styles.container}>
      {days.map((day, index) => {
        const backgroundColor = getGradientColor(day.category, day.completion);
        const dayNumber = getDayNumber(day.date);

        return (
          <Pressable
            key={index}
            onPress={() => handleDayPress(day)}
            style={styles.dayCard}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
          >
            <View style={[styles.dayCardContent, { backgroundColor }]}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.dayName}
                lightColor="#000"
                darkColor="#fff"
              >
                {day.dayName}
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={styles.dayNumber}
                lightColor="#000"
                darkColor="#fff"
              >
                {dayNumber}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
