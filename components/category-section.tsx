import { CATEGORY_COLORS } from '@/constants/Colors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ACCESSORY_LABELS, getAccessoryTierLabel } from '@/lib/accessoires';
import { CategoryType, Habit } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AccessoryIcon } from './accessory-icon';
import { CategoryModal } from './category-modal';
import { HabitCard } from './habit-card';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export interface CategorySectionProps {
  category: CategoryType;
  categoryLabel: string;
  completionPct?: number;
  score?:      number;
  overlayHeight?: number;
  overlayColor?:  string;
  habits: Habit[];
  weekDates: string[];
  weekValues: Record<string, Record<string, number>>;
  onHabitValueChange: (habitId: string, date: string, newValue: number) => void;
  onHabitUpdate?: (updatedHabit: Habit) => void;
  onHabitDelete?: (habitId: string) => void;
  onAddHabit?: (habit: any) => Promise<void>;
  onUpdateCategory?: (label: string, color: string) => void;
  onAccessoryPress?: () => void;
}

export function CategorySection({
  category,
  categoryLabel,
  completionPct = 0,
  score = 0,
  overlayHeight = 0,
  overlayColor = 'rgba(128, 128, 128, 0.6)',
  habits,
  weekDates,
  weekValues,
  onHabitValueChange,
  onHabitUpdate,
  onHabitDelete,
  onAddHabit,
  onUpdateCategory,
  onAccessoryPress,
}: CategorySectionProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const [editModalVisible, setEditModalVisible] = useState(false);

  const categoryColor = CATEGORY_COLORS[category];
  const accentColor = categoryColor.mid;

  const categoryHabits = habits.filter(h => h.category === category);

  if (categoryHabits.length === 0 && !onAddHabit) {
    return null;
  }

  const tierLabel = getAccessoryTierLabel(score);
  const accessoryLabel = ACCESSORY_LABELS[category];

  return (
    <ThemedView style={[styles.section, themeStyles.surface]}>
      <CategoryModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={(name, color) => onUpdateCategory?.(name, color)}
        initialName={categoryLabel}
        initialColor={accentColor}
      />

      {/* Header: accessory icon + title/progress + edit button */}
      <View style={styles.header}>
        {/* Tappable accessory icon */}
        <Pressable
          onPress={onAccessoryPress}
          style={[styles.accessoryWrapper, { borderColor: accentColor + '44' }]}
          accessibilityRole="button"
          accessibilityLabel={`${accessoryLabel} — ${tierLabel}`}
        >
          <AccessoryIcon
            category={category}
            score={score}
            size={48}
            overlayHeight={overlayHeight}
            overlayColor={overlayColor}
          />
        </Pressable>

        {/* Category info */}
        <View style={styles.categoryInfo}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={[styles.categoryTitle, { color: colors.text }]}>
              {categoryLabel}
            </ThemedText>
            {onUpdateCategory && (
              <Pressable onPress={() => setEditModalVisible(true)} style={styles.editButton}>
                <MaterialIcons name="edit" size={16} color={accentColor} />
              </Pressable>
            )}
          </View>

          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPct}%`, backgroundColor: accentColor },
              ]}
            />
          </View>

          {/* % + tier label */}
          <View style={styles.progressMeta}>
            <ThemedText style={[styles.progressPct, { color: accentColor }]}>
              {completionPct}%
            </ThemedText>
            <ThemedText style={[styles.tierLabel, { color: colors.textSubtle }]}>
              {accessoryLabel} · {tierLabel}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Habits */}
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
        {/* {onAddHabit && (
          <Pressable
            style={[styles.addHabitButton, themeStyles.surfaceRaised, { borderColor: accentColor }]}
            onPress={() => onAddHabit({ category }).catch(() => {})}
          >
            <MaterialIcons name="add" size={24} color={accentColor} />
            <ThemedText style={[styles.addHabitText, { color: accentColor }]}>
              Add
            </ThemedText>
          </Pressable>
        )} */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  accessoryWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  categoryInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  editButton: {
    padding: 4,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '700',
  },
  tierLabel: {
    fontSize: 10,
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
