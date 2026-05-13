import { StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, CATEGORY_COLORS } from '@/constants/Colors';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { HabitCard } from './habit-card';
import { Habit, CategoryType } from '@/lib/types';

export interface CategorySectionProps {
  category: CategoryType;
  habits: Habit[];
  habitValues: Record<string, number>; // habit_id -> current value
  onHabitValueChange: (habitId: string, newValue: number) => void;
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
  habitValues,
  onHabitValueChange,
}: CategorySectionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get category color for accent
  const categoryColor = CATEGORY_COLORS[category];
  const accentColor = categoryColor.mid;

  // Filter habits for this category
  const categoryHabits = habits.filter(h => h.category === category);

  if (categoryHabits.length === 0) {
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
            currentValue={habitValues[habit.id] ?? 0}
            onValueChange={onHabitValueChange}
          />
        ))}
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
});
