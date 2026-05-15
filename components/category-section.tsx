import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { Colors, CATEGORY_COLORS } from '@/constants/Colors';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { HabitCard } from './habit-card';
import { AddHabitCard } from './add-habit-card';
import { CategoryModal } from './category-modal';
import { Habit, CategoryType } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface CategorySectionProps {
  category: CategoryType;
  categoryLabel: string;
  habits: Habit[];
  weekDates: string[];
  weekValues: Record<string, Record<string, number>>; // date -> (habit_id -> value)
  onHabitValueChange: (habitId: string, date: string, newValue: number) => void;
  onHabitUpdate?: (updatedHabit: Habit) => void;
  onHabitDelete?: (habitId: string) => void;
  onAddHabit?: (habit: any) => Promise<void>;
  onUpdateCategory?: (label: string, color: string) => void;
}

export function CategorySection({
  category,
  categoryLabel,
  habits,
  weekDates,
  weekValues,
  onHabitValueChange,
  onHabitUpdate,
  onHabitDelete,
  onAddHabit,
  onUpdateCategory,
}: CategorySectionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Get category color for accent
  const categoryColor = CATEGORY_COLORS[category];
  const accentColor = categoryColor.mid;

  // Filter habits for this category
  const categoryHabits = habits.filter(h => h.category === category);

  if (categoryHabits.length === 0 && !onAddHabit) {
    return null;
  }

  const handleSaveCategory = (name: string, color: string) => {
    if (onUpdateCategory) {
      onUpdateCategory(name, color);
    }
  };

  return (
    <ThemedView
      style={[
        styles.section,
        {
          backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
        },
      ]}
    >
      <CategoryModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveCategory}
        initialName={categoryLabel}
        initialColor={accentColor}
      />

      <View style={[styles.titleContainer, { borderBottomColor: accentColor }]}>
        <ThemedText
          type="subtitle"
          style={[
            styles.categoryTitle,
            {
              color: isDark ? '#ffffff' : '#000000',
            },
          ]}
        >
          {categoryLabel}
        </ThemedText>
        {onUpdateCategory && (
          <Pressable
            onPress={() => setEditModalVisible(true)}
            style={styles.editButton}
          >
            <MaterialIcons name="edit" size={20} color={accentColor} />
          </Pressable>
        )}
      </View>

      <View style={styles.habitsContainer}>
        {categoryHabits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            weekDates={weekDates}
            weekValues={weekValues}
            onValueChange={onHabitValueChange}
            onHabitUpdate={onHabitUpdate}
            onHabitDelete={onHabitDelete}
          />
        ))}
        {onAddHabit && (
          <Pressable
            style={[
              styles.addHabitButton,
              {
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                borderColor: accentColor,
              },
            ]}
            onPress={() => {
              // Open add habit modal with pre-selected category
              onAddHabit({ category }).catch(() => {});
            }}
          >
            <MaterialIcons name="add" size={24} color={accentColor} />
            <ThemedText style={[styles.addHabitText, { color: accentColor }]}>
              Add
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 14,
    paddingVertical: 0,
    marginBottom: 8,
  },
  titleContainer: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  editButton: {
    padding: 4,
  },
  habitsContainer: {
    paddingHorizontal: 0,
    paddingBottom: 12,
  },
  addHabitButton: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addHabitText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
