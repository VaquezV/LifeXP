import { StyleSheet, View, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CATEGORY_COLORS } from '@/constants/Colors';
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

  // Get category color for accent
  const categoryColor = CATEGORY_COLORS[habit.category];
  const accentColor = categoryColor.mid;

  // Determine increment amount and unit label
  const getIncrementConfig = () => {
    switch (habit.frequency_type) {
      case 'times_per_day':
        return { increment: 1, unit: 'x', label: 'times' };
      case 'per_day':
        return {
          increment: 5,
          unit: 'min',
          label: habit.target_value > 100 ? 'minutes' : 'units',
        };
      case 'times_per_week':
        return { increment: 1, unit: 'x', label: 'week' };
      default:
        return { increment: 1, unit: '', label: '' };
    }
  };

  const config = getIncrementConfig();

  const handleIncrement = () => {
    onValueChange(habit.id, currentValue + config.increment);
  };

  const handleDecrement = () => {
    const newValue = Math.max(0, currentValue - config.increment);
    onValueChange(habit.id, newValue);
  };

  const handleReset = () => {
    onValueChange(habit.id, 0);
  };

  const handleHalf = () => {
    const target =
      habit.frequency_type === 'per_day' ? habit.target_value : habit.target_value;
    onValueChange(habit.id, Math.floor(target / 2));
  };

  const handleFull = () => {
    onValueChange(habit.id, habit.target_value);
  };

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
          borderLeftColor: accentColor,
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
        <View style={styles.titleSection}>
          <ThemedText type="defaultSemiBold" style={[styles.habitName, { color: isDark ? '#ffffff' : '#000000' }]}>
            {habit.name}
          </ThemedText>
          <ThemedText style={[styles.frequencyLabel, { color: isDark ? '#999999' : '#666666' }]}>
            {habit.frequency_type === 'times_per_day'
              ? `${habit.target_value}x per day`
              : habit.frequency_type === 'per_day'
                ? `${habit.min_value}-${habit.target_value} min/day`
                : `${habit.target_value}x per week`}
          </ThemedText>
        </View>
        <View style={styles.percentageBox}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.percentage, { color: accentColor }]}
          >
            {completionPercentage}%
          </ThemedText>
        </View>
      </View>

      <View style={styles.controlsSection}>
        <View style={styles.valueDisplay}>
          <ThemedText style={[styles.valueNumber, { color: isDark ? '#ffffff' : '#000000' }]}>
            {currentValue}
          </ThemedText>
          <ThemedText style={[styles.valueUnit, { color: isDark ? '#999999' : '#666666' }]}>
            {config.unit}
          </ThemedText>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.minusButton]}
            onPress={handleDecrement}
          >
            <ThemedText style={[styles.buttonText, { color: accentColor }]}>−</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.button, styles.plusButton, { backgroundColor: accentColor }]}
            onPress={handleIncrement}
          >
            <ThemedText style={styles.buttonTextPlus}>+</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          style={[styles.quickButton, { borderColor: isDark ? '#444444' : '#cccccc' }]}
          onPress={handleReset}
        >
          <ThemedText
            style={[
              styles.quickButtonText,
              { color: isDark ? '#aaaaaa' : '#666666' },
            ]}
          >
            Reset
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.quickButton, { borderColor: isDark ? '#444444' : '#cccccc' }]}
          onPress={handleHalf}
        >
          <ThemedText
            style={[
              styles.quickButtonText,
              { color: isDark ? '#aaaaaa' : '#666666' },
            ]}
          >
            Half
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.quickButton, { borderColor: accentColor }]}
          onPress={handleFull}
        >
          <ThemedText
            style={[styles.quickButtonText, { color: accentColor }]}
          >
            Full
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
    marginRight: 10,
  },
  titleSection: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  frequencyLabel: {
    fontSize: 11,
  },
  percentageBox: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 45,
    textAlign: 'right',
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  valueDisplay: {
    alignItems: 'center',
  },
  valueNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  valueUnit: {
    fontSize: 11,
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusButton: {
    borderWidth: 1.5,
    borderColor: '#666666',
  },
  plusButton: {
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonTextPlus: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
