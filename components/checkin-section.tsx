import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { CheckinItemSimplified } from './checkin-item-simplified';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { Habit } from '@/lib/types';

export interface CheckinSectionProps {
  habits: Habit[];
  values: Record<string, number>;
  onValueChange: (habitId: string, newValue: number) => void;
  onManageItems: () => void;
}

export function CheckinSection({
  habits,
  values,
  onValueChange,
  onManageItems,
}: CheckinSectionProps) {
  const theme = useWolfLevelTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <ThemedText style={[styles.title, { color: theme.text }]}>
          CHECKIN
        </ThemedText>
        <Pressable
          onPress={onManageItems}
          style={[styles.editButton, { backgroundColor: theme.surfaceRaised }]}
        >
          <MaterialIcons name="edit" size={20} color={theme.tint} />
        </Pressable>
      </View>

      <View style={{ backgroundColor: theme.surface }}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              Aucun item • Cliquez sur le crayon pour en ajouter
            </ThemedText>
          </View>
        ) : (
          habits.map((habit) => (
            <CheckinItemSimplified
              key={habit.id}
              habit={habit}
              value={values[habit.id] || 0}
              onValueChange={(newValue) =>
                onValueChange(habit.id, newValue)
              }
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
