import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { ThemedText } from './themed-text';
import { getGradientColor } from '@/constants/theme';
import { CategoryType } from '@/lib/types';
import { useAppTheme } from '@/hooks/use-app-theme';

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
  const { colors, styles: themeStyles } = useAppTheme();
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 380;

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

  // Split days into two rows on small screens
  const firstRow = isSmallScreen ? days.slice(0, 4) : days;
  const secondRow = isSmallScreen ? days.slice(4) : [];

  const renderRow = (rowDays: DayData[]) => (
    <View style={styles.row}>
      {rowDays.map((day, index) => {
        const backgroundColor = getGradientColor(day.category, day.completion);
        const dayNumber = getDayNumber(day.date);

        return (
            <Pressable
            key={index}
            onPress={() => handleDayPress(day)}
            style={[styles.dayCard, isSmallScreen && styles.dayCardSmall]}
            android_ripple={{ color: colors.overlay }}
          >
            <View style={[styles.dayCardContent, { backgroundColor }]}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.dayNumber}
              >
                {dayNumber}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        themeStyles.surface,
        themeStyles.dividerBottom,
      ]}
    >
      {renderRow(firstRow)}
      {secondRow.length > 0 && renderRow(secondRow)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dayCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayCardSmall: {
    borderRadius: 10,
  },
  dayCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    aspectRatio: 1,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
