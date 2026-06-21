import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

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
  const { colors } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.button,
        isCompleted && { backgroundColor: accentColor },
        !isCompleted && { borderColor: accentColor, borderWidth: 1 },
      ]}
      onPress={onPress}
    >
        <ThemedText
        style={[
          styles.dateText,
          {
            color: isCompleted ? colors.onPrimary : accentColor,
            fontWeight: isToday ? '700' : '600',
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
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
  },
});
