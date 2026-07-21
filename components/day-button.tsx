import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { getReadableTextColor } from '@/lib/theme-evolution';

interface DayButtonProps {
  date: string; // formatted date string (e.g., "01", "15")
  isCompleted: boolean;
  isToday: boolean;
  accentColor: string;
  onPress: () => void;
}

export function DayButton({
  date,
  isCompleted,
  isToday,
  accentColor,
  onPress,
}: DayButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        isCompleted && {
          backgroundColor: accentColor,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 6,
        },
        !isCompleted && {
          borderColor: accentColor,
          borderWidth: 1.5,
        },
        isToday && {
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isCompleted ? 0.5 : 0.35,
          shadowRadius: isCompleted ? 8 : 6,
          elevation: isCompleted ? 6 : 4,
        },
      ]}
      onPress={onPress}
    >
      <ThemedText
        style={[
          styles.dateText,
          {
            color: isCompleted ? getReadableTextColor(accentColor) : accentColor,
            fontWeight: isToday ? '900' : '700',
            fontSize: isToday ? 15 : 13,
          },
        ]}
      >
        {date}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  dateText: {
    letterSpacing: -0.3,
  },
});
