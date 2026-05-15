import { Pressable, StyleSheet, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DayButtonProps {
  date: string; // DD format
  isCompleted?: boolean;
  isToday?: boolean;
  accentColor: string;
  onPress?: () => void;
}

export function DayButton({
  date,
  isCompleted = false,
  isToday = false,
  accentColor,
  onPress,
}: DayButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isCompleted
    ? accentColor.replace('ff', '2a') // Darken accent for completed state
    : '#333333';

  const textColor = isCompleted ? '#ffffff' : isToday ? accentColor : '#999999';

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {date}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
