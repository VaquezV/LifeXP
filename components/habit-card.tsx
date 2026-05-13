import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
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

  const completionPercentage = calculateHabitCompletion(habit, currentValue);
  const categoryColor = CATEGORY_COLORS[habit.category];
  const accentColor = categoryColor.mid;

  const renderButtons = () => {
    if (habit.frequency_type === 'per_day') {
      // Presets: 0%, 25%, 50%, 75%, 100%
      const presets = [
        { label: '0', value: 0 },
        { label: '¼', value: Math.floor(habit.target_value * 0.25) },
        { label: '½', value: Math.floor(habit.target_value * 0.5) },
        { label: '¾', value: Math.floor(habit.target_value * 0.75) },
        { label: '1/1', value: habit.target_value },
      ];

      return (
        <View style={styles.buttonContainer}>
          {presets.map(preset => (
            <Pressable
              key={preset.value}
              style={[
                styles.presetButton,
                currentValue === preset.value && {
                  backgroundColor: accentColor,
                },
                currentValue !== preset.value && {
                  borderColor: accentColor,
                  borderWidth: 1,
                },
              ]}
              onPress={() => onValueChange(habit.id, preset.value)}
            >
              <ThemedText
                style={[
                  styles.presetButtonText,
                  {
                    color:
                      currentValue === preset.value ? '#ffffff' : accentColor,
                  },
                ]}
              >
                {preset.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      );
    }

    if (habit.frequency_type === 'times_per_day') {
      // Integer buttons from 0 to target
      const buttons = Array.from(
        { length: habit.target_value + 1 },
        (_, i) => i
      );

      return (
        <View style={styles.buttonContainer}>
          {buttons.map(num => (
            <Pressable
              key={num}
              style={[
                styles.countButton,
                currentValue === num && {
                  backgroundColor: accentColor,
                },
                currentValue !== num && {
                  borderColor: accentColor,
                  borderWidth: 1,
                },
              ]}
              onPress={() => onValueChange(habit.id, num)}
            >
              <ThemedText
                style={[
                  styles.countButtonText,
                  {
                    color:
                      currentValue === num ? '#ffffff' : accentColor,
                  },
                ]}
              >
                {num}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      );
    }

    if (habit.frequency_type === 'times_per_week') {
      // Yes/No buttons (0 or 1)
      return (
        <View style={styles.buttonContainer}>
          <Pressable
            style={[
              styles.yesnoButton,
              currentValue === 0 && {
                backgroundColor: accentColor,
              },
              currentValue !== 0 && {
                borderColor: accentColor,
                borderWidth: 1,
              },
            ]}
            onPress={() => onValueChange(habit.id, 0)}
          >
            <ThemedText
              style={[
                styles.yesnoButtonText,
                {
                  color: currentValue === 0 ? '#ffffff' : accentColor,
                },
              ]}
            >
              Non
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.yesnoButton,
              currentValue === 1 && {
                backgroundColor: accentColor,
              },
              currentValue !== 1 && {
                borderColor: accentColor,
                borderWidth: 1,
              },
            ]}
            onPress={() => onValueChange(habit.id, 1)}
          >
            <ThemedText
              style={[
                styles.yesnoButtonText,
                {
                  color: currentValue === 1 ? '#ffffff' : accentColor,
                },
              ]}
            >
              Oui
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return null;
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
          <ThemedText
            type="defaultSemiBold"
            style={[
              styles.habitName,
              { color: isDark ? '#ffffff' : '#000000' },
            ]}
          >
            {habit.name}
          </ThemedText>
          <ThemedText
            style={[
              styles.frequencyLabel,
              { color: isDark ? '#999999' : '#666666' },
            ]}
          >
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

      {renderButtons()}
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
    marginBottom: 14,
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
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    minWidth: '18%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countButton: {
    minWidth: 40,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  yesnoButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesnoButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
