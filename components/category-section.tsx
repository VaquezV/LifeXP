import { StyleSheet, View, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, CATEGORY_COLORS } from '@/constants/Colors';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { HabitCard } from './habit-card';
import { AddHabitCard } from './add-habit-card';
import { Habit, CategoryType } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface CategorySectionProps {
  category: CategoryType;
  habits: Habit[];
  weekDates: string[];
  weekValues: Record<string, Record<string, number>>; // date -> (habit_id -> value)
  onHabitValueChange: (habitId: string, date: string, newValue: number) => void;
  onAddHabit?: (habit: any) => Promise<void>;
}

const CATEGORY_LABELS: Record<CategoryType, string> = {
  self_care: 'Self Care',
  dev_perso: 'Personal Development',
  vie_familiale: 'Family Life',
  vie_pro: 'Professional',
};

export function CategorySection({
  category,
  habits,
  weekDates,
  weekValues,
  onHabitValueChange,
  onAddHabit,
}: CategorySectionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get category color for accent
  const categoryColor = CATEGORY_COLORS[category];
  const accentColor = categoryColor.mid;

  // Filter habits for this category
  const categoryHabits = habits.filter(h => h.category === category);

  if (categoryHabits.length === 0 && !onAddHabit) {
    return null;
  }

  return (
    <ThemedView
      style={[
        styles.section,
        {
          backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
        },
      ]}
    >
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
          {CATEGORY_LABELS[category]}
        </ThemedText>
      </View>

      <View style={styles.habitsContainer}>
        {categoryHabits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            weekDates={weekDates}
            weekValues={weekValues}
            onValueChange={onHabitValueChange}
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
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
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
