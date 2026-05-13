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
  const themeColors = isDark ? Colors.dark : Colors.light;

  // Get light tint from category color
  const categoryColor = CATEGORY_COLORS[category];
  const backgroundTint = categoryColor.light;

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
          backgroundColor: isDark ? '#1a1a1a' : backgroundTint,
        },
      ]}
    >
      <ThemedText type="subtitle" style={styles.categoryTitle}>
        {CATEGORY_LABELS[category]}
      </ThemedText>

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
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  categoryTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: '600',
  },
  habitsContainer: {
    gap: 0, // Gap handled by HabitCard's marginBottom
  },
});
