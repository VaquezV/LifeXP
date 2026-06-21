import { StyleSheet, View, Pressable } from 'react-native';
import { useState, useMemo, useRef } from 'react';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { HabitModal } from './habit-modal';
import { Habit } from '@/lib/types';
import { calculateHabitCompletion } from '@/lib/scoring';
import { DayButton } from './day-button';
import { SliderInput } from './slider-input';
import { updateHabit, deleteHabit } from '@/lib/habit-operations';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '@/hooks/use-app-theme';

export interface HabitCardProps {
  habit: Habit;
  weekDates: string[];
  weekValues: Record<string, Record<string, number>>; // date -> (habit_id -> value)
  onValueChange: (habitId: string, date: string, newValue: number) => void;
  onHabitUpdate?: (updatedHabit: Habit) => void;
  onHabitDelete?: (habitId: string) => void;
}

export function HabitCard({
  habit,
  weekDates,
  weekValues,
  onValueChange,
  onHabitUpdate,
  onHabitDelete,
}: HabitCardProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const categoryColor = CATEGORY_COLORS[habit.category];
  const accentColor = categoryColor.mid;

  const dayNames = ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'];
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [editModalVisible, setEditModalVisible] = useState(false);

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
          const dayNum = dateObj.getDate().toString().padStart(2, '0');
          const isSelected = date === selectedDate;

          return (
            <DayButton
              key={date}
              date={dayNum}
              isCompleted={isSelected}
              isToday={date === today}
              accentColor={accentColor}
              onPress={() => setSelectedDate(date)}
            />
          );
        })}
      </View>
    );
  };

  const getSegmentSize = (targetMinutes: number): number => {
    if (targetMinutes < 30) return 5;
    if (targetMinutes < 60) return 15;
    if (targetMinutes < 300) return 30;
    return 60;
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const renderPresetButtons = () => {
    if (habit.frequency_type === 'per_day') {
      return (
        <SliderInput
          value={selectedValue}
          min={habit.min_value}
          max={habit.target_value}
          step={15}
          accentColor={accentColor}
          onValueChange={(value) => onValueChange(habit.id, selectedDate, value)}
        />
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
                    color: selectedValue === num ? colors.onPrimary : accentColor,
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
                    color: selectedValue === 0 ? colors.onPrimary : accentColor,
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
                    color: selectedValue === 1 ? colors.onPrimary : accentColor,
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

  const handleSaveHabit = async (updates: Partial<Habit>) => {
    const updated = await updateHabit(habit.id, updates);
    if (updated && onHabitUpdate) {
      onHabitUpdate(updated);
    }
  };

  const handleDeleteHabit = async () => {
    const success = await deleteHabit(habit.id);
    if (success && onHabitDelete) {
      onHabitDelete(habit.id);
    }
  };

  return (
    <>
      <HabitModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        habit={habit}
      />
      <ThemedView
        style={[
          styles.card,
          themeStyles.surfaceRaised,
          { borderLeftColor: accentColor },
        ]}
      >
        <View style={styles.header}>
          <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
        <View style={styles.titleSection}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.habitName, { color: colors.text }]}
          >
            {habit.name}
          </ThemedText>
          <ThemedText
            style={[
              styles.frequencyLabel,
              { color: colors.textMuted },
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
        <Pressable
          onPress={() => setEditModalVisible(true)}
          style={styles.editButton}
        >
          <MaterialIcons name="edit" size={20} color={accentColor} />
        </Pressable>
      </View>

      {renderWeekDays()}
      {renderPresetButtons()}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
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
    alignItems: 'center',
    marginRight: 8,
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 45,
    textAlign: 'center',
  },
  editButton: {
    padding: 4,
  },
  weekContainer: {
    flexDirection: 'row',
    gap: 4,
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
