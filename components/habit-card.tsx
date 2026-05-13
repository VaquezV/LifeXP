import { StyleSheet, TextInput, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, CATEGORY_COLORS, getGradientColor } from '@/constants/Colors';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Habit } from '@/lib/types';
import { calculateHabitCompletion } from '@/lib/scoring';

export interface HabitCardProps {
  habit: Habit;
  currentValue: number;
  onValueChange: (habitId: string, newValue: number) => void;
}

export function HabitCard({ habit, currentValue, onValueChange }: HabitCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  // Calculate completion percentage
  const completionPercentage = calculateHabitCompletion(habit, currentValue);

  // Get the background color based on completion
  const backgroundColor = getGradientColor(habit.category, completionPercentage);

  // Handle value change based on frequency type
  const handleValueChange = (text: string) => {
    const numValue = parseInt(text, 10) || 0;
    onValueChange(habit.id, numValue);
  };

  // Determine input placeholder and keyboard type based on frequency
  const getInputConfig = () => {
    switch (habit.frequency_type) {
      case 'times_per_day':
        return {
          placeholder: `0-${habit.target_value}`,
          label: 'times',
          keyboardType: 'number-pad' as const,
        };
      case 'per_day':
        return {
          placeholder: `${habit.min_value}-${habit.target_value}`,
          label: habit.target_value > 100 ? 'min' : 'units',
          keyboardType: 'number-pad' as const,
        };
      case 'times_per_week':
        return {
          placeholder: '0',
          label: 'week total',
          keyboardType: 'number-pad' as const,
        };
      default:
        return {
          placeholder: '0',
          label: '',
          keyboardType: 'number-pad' as const,
        };
    }
  };

  const inputConfig = getInputConfig();

  return (
    <ThemedView style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
        <View style={styles.titleSection}>
          <ThemedText type="defaultSemiBold" style={styles.habitName}>
            {habit.name}
          </ThemedText>
          <ThemedText style={styles.frequencyLabel}>
            {habit.frequency_type === 'times_per_day'
              ? `${habit.target_value}x per day`
              : habit.frequency_type === 'per_day'
                ? `${habit.min_value}-${habit.target_value} min/day`
                : `${habit.target_value}x per week`}
          </ThemedText>
        </View>
        <ThemedText type="defaultSemiBold" style={styles.percentage}>
          {completionPercentage}%
        </ThemedText>
      </View>

      {habit.frequency_type !== 'times_per_week' && (
        <View style={styles.inputSection}>
          <TextInput
            style={[
              styles.input,
              {
                color: themeColors.text,
                borderColor: themeColors.icon,
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
              },
            ]}
            placeholderTextColor={themeColors.icon}
            value={currentValue.toString()}
            onChangeText={handleValueChange}
            keyboardType={inputConfig.keyboardType}
            placeholder={inputConfig.placeholder}
          />
          <ThemedText style={styles.unitLabel}>{inputConfig.label}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    marginBottom: 4,
  },
  frequencyLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  percentage: {
    fontSize: 18,
    minWidth: 50,
    textAlign: 'right',
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  unitLabel: {
    fontSize: 14,
    opacity: 0.7,
    minWidth: 50,
  },
});
