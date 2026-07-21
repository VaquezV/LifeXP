import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';

export interface WeekNavigatorProps {
  weekDates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  todayKey: string;
}

export function WeekNavigator({
  weekDates,
  selectedDate,
  onDateSelect,
  todayKey,
}: WeekNavigatorProps) {
  const theme = useWolfLevelTheme();

  const getDayLabel = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    const days = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
    return days[date.getDay()];
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.getDate().toString().padStart(2, '0');
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {weekDates.map((date) => {
        const isSelected = date === selectedDate;
        const isToday = date === todayKey;

        return (
          <Pressable
            key={date}
            onPress={() => onDateSelect(date)}
            style={[
              styles.dayButton,
              {
                backgroundColor: isSelected
                  ? theme.tint
                  : isToday
                    ? theme.surface
                    : theme.bgPrimary,
                borderColor: isToday ? theme.border : 'transparent',
                borderWidth: isToday ? 1 : 0,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.dayLabel,
                {
                  color: isSelected ? theme.surface : theme.text,
                  fontWeight: isSelected ? '800' : '600',
                },
              ]}
            >
              {getDayLabel(date)}
            </ThemedText>
            <ThemedText
              style={[
                styles.dayNumber,
                {
                  color: isSelected ? theme.surface : theme.text,
                  fontWeight: isSelected ? '800' : '700',
                },
              ]}
            >
              {getDateLabel(date)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 54,
  },
  dayLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  dayNumber: {
    fontSize: 13,
    marginTop: 2,
  },
});
