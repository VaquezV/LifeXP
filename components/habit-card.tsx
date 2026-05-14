import { StyleSheet, View, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState, useMemo, useRef } from 'react';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Habit } from '@/lib/types';
import { calculateHabitCompletion } from '@/lib/scoring';

export interface HabitCardProps {
  habit: Habit;
  weekDates: string[];
  weekValues: Record<string, Record<string, number>>; // date -> (habit_id -> value)
  onValueChange: (habitId: string, date: string, newValue: number) => void;
}

export function HabitCard({
  habit,
  weekDates,
  weekValues,
  onValueChange,
}: HabitCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const categoryColor = CATEGORY_COLORS[habit.category];
  const accentColor = categoryColor.mid;

  const dayNames = ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'];
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const selectedValue = weekValues[selectedDate]?.[habit.id] ?? 0;

  // Calculate week total for display
  const weekTotal = useMemo(() => {
    return weekDates.reduce((sum, date) => {
      return sum + (weekValues[date]?.[habit.id] ?? 0);
    }, 0);
  }, [weekDates, weekValues, habit.id]);

  // Calculate weekly completion percentage
  const weeklyCompletion = useMemo(() => {
    if (habit.frequency_type === 'times_per_week') {
      return Math.min(100, Math.floor((weekTotal / habit.target_value) * 100));
    }
    // For daily habits, calculate average
    let totalCompletion = 0;
    let count = 0;
    for (const date of weekDates) {
      const value = weekValues[date]?.[habit.id] ?? 0;
      const completion = calculateHabitCompletion(habit, value);
      totalCompletion += completion;
      count++;
    }
    return Math.floor(totalCompletion / count);
  }, [weekDates, weekValues, habit]);

  const renderWeekDays = () => {
    return (
      <View style={styles.weekContainer}>
        {weekDates.map((date, index) => {
          const dateObj = new Date(date);
          const dayNum = dateObj.getDate();
          const isSelected = date === selectedDate;
          const isToday = date === today;

          return (
            <Pressable
              key={date}
              style={[
                styles.dayButton,
                isSelected && { backgroundColor: accentColor },
                !isSelected && { borderColor: accentColor, borderWidth: 1 },
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <ThemedText
                style={[
                  styles.dayLabel,
                  {
                    color: isSelected ? '#ffffff' : accentColor,
                    fontSize: 10,
                  },
                ]}
              >
                {dayNames[index]}
              </ThemedText>
              <ThemedText
                style={[
                  styles.dayNumber,
                  {
                    color: isSelected ? '#ffffff' : isDark ? '#ffffff' : '#000000',
                    fontWeight: isToday ? '700' : '600',
                  },
                ]}
              >
                {dayNum}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderPresetButtons = () => {
    if (habit.frequency_type === 'per_day') {
      // Create 10 slider segments for easy clicking
      const segments = 10;
      const segmentValue = Math.ceil(habit.target_value / segments);

      return (
        <View style={styles.sliderContainer}>
          <View style={styles.sliderBar}>
            {Array.from({ length: segments + 1 }).map((_, i) => {
              const value = i * segmentValue;
              const isActive = selectedValue >= value;
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.sliderSegment,
                    isActive && { backgroundColor: accentColor },
                    !isActive && { backgroundColor: isDark ? '#333333' : '#cccccc' },
                  ]}
                  onPress={() => onValueChange(habit.id, selectedDate, Math.min(value, habit.target_value))}
                />
              );
            })}
          </View>
          <View style={styles.sliderLabelContainer}>
            <ThemedText style={[styles.sliderLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
              0
            </ThemedText>
            <ThemedText style={[styles.sliderValue, { color: accentColor }]}>
              {selectedValue}
            </ThemedText>
            <ThemedText style={[styles.sliderLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
              {habit.target_value}
            </ThemedText>
          </View>
        </View>
      );
    }

    if (habit.frequency_type === 'times_per_day') {
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
                selectedValue === num && {
                  backgroundColor: accentColor,
                },
                selectedValue !== num && {
                  borderColor: accentColor,
                  borderWidth: 1,
                },
              ]}
              onPress={() => onValueChange(habit.id, selectedDate, num)}
            >
              <ThemedText
                style={[
                  styles.countButtonText,
                  {
                    color: selectedValue === num ? '#ffffff' : accentColor,
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
      return (
        <View style={styles.buttonContainer}>
          <Pressable
            style={[
              styles.yesnoButton,
              selectedValue === 0 && {
                backgroundColor: accentColor,
              },
              selectedValue !== 0 && {
                borderColor: accentColor,
                borderWidth: 1,
              },
            ]}
            onPress={() => onValueChange(habit.id, selectedDate, 0)}
          >
            <ThemedText
              style={[
                styles.yesnoButtonText,
                {
                  color: selectedValue === 0 ? '#ffffff' : accentColor,
                },
              ]}
            >
              Non
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.yesnoButton,
              selectedValue === 1 && {
                backgroundColor: accentColor,
              },
              selectedValue !== 1 && {
                borderColor: accentColor,
                borderWidth: 1,
              },
            ]}
            onPress={() => onValueChange(habit.id, selectedDate, 1)}
          >
            <ThemedText
              style={[
                styles.yesnoButtonText,
                {
                  color: selectedValue === 1 ? '#ffffff' : accentColor,
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
            {weeklyCompletion}%
          </ThemedText>
        </View>
      </View>

      {renderWeekDays()}
      {renderPresetButtons()}
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
  weekContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  dayButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 14,
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
  sliderContainer: {
    gap: 8,
  },
  sliderBar: {
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 1,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  sliderSegment: {
    flex: 1,
    borderRadius: 4,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
