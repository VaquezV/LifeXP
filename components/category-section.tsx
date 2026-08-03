// components/category-section.tsx
import { CATEGORY_COLORS } from '@/constants/Colors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ACCESSORY_LABELS, CATEGORY_CURRENCY_NAMES } from '@/lib/category-elements-config';
import { formatPoints, getAccessoryTierLabel } from '@/lib/accessoires';
import { ensureContrast } from '@/lib/theme-evolution';
import { CategoryType, Habit } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { AccessoryIcon } from './accessory-icon';
import { CategoryModal } from './category-modal';
import { HabitCard } from './habit-card';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';


export interface CategorySectionProps {
  category: CategoryType;
  categoryLabel: string;
  categoryLevel: number;
  pointsInLevel: number;
  habits: Habit[];
  weekDates: string[];
  weekValues: Record<string, Record<string, number>>;
  onHabitValueChange: (habitId: string, date: string, newValue: number) => void;
  onHabitUpdate?: (updatedHabit: Habit) => void;
  onHabitDelete?: (habitId: string) => void;
  onAddHabit?: () => void;
  onUpdateCategory?: (label: string, color: string) => void;
  onAccessoryPress?: () => void;
}

export function CategorySection({
  category,
  categoryLabel,
  categoryLevel,
  pointsInLevel,
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const categoryColor = CATEGORY_COLORS[category];
  const accentColor = ensureContrast(categoryColor.mid, colors.surface, 4.5);
  const categoryHabits = habits.filter(h => h.category === category);

  const currencyName = CATEGORY_CURRENCY_NAMES[category];
  const tierLabel = getAccessoryTierLabel(categoryLevel);
  const accessoryLabel = ACCESSORY_LABELS[category];
  const pointsDisplay = formatPoints(pointsInLevel, currencyName);
  const levelDisplay = `N${categoryLevel} · ${tierLabel}`;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  function handleAddPress() {
    if (!onAddHabit) return;
    onAddHabit();
  }

  if (categoryHabits.length === 0 && !onAddHabit) return null;

  return (
    <ThemedView style={[styles.section, themeStyles.surface]}>
      <CategoryModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={(name, color) => onUpdateCategory?.(name, color)}
        initialName={categoryLabel}
        initialColor={accentColor}
      />

      {/* Header */}
      <View style={[styles.header, { borderLeftColor: accentColor }]}>
        <Pressable
          onPress={onAccessoryPress}
          style={[
            styles.accessoryWrapper,
            {
              borderColor: accentColor + '4d',
              backgroundColor: accentColor + '0d',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${accessoryLabel} — ${tierLabel}`}
        >
          <AccessoryIcon
            category={category}
            level={categoryLevel}
            size={56}
          />
        </Pressable>

        <View style={styles.categoryInfo}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={[styles.categoryTitle, { color: colors.text }]}>
              {categoryLabel}
            </ThemedText>
            <View style={styles.titleActions}>
              {onUpdateCategory && (
                <Pressable onPress={() => setEditModalVisible(true)} style={styles.iconButton}>
                  <MaterialIcons name="edit" size={18} color={accentColor} />
                </Pressable>
              )}
              {onAddHabit && (
                <Pressable onPress={handleAddPress} style={styles.iconButton} accessibilityRole="button">
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <MaterialIcons name="add-circle" size={22} color={accentColor} />
                  </Animated.View>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <ThemedText style={[styles.pointsText, { color: accentColor }]}>
              {pointsDisplay}
            </ThemedText>
            <View style={styles.metaBadge}>
              <ThemedText style={[styles.levelText, { color: colors.textMuted }]}>
                {levelDisplay}
              </ThemedText>
            </View>
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
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 14,
    paddingVertical: 0,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderRadius: 14,
    marginHorizontal: -14,
    paddingHorizontal: 14,
  },
  accessoryWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
  },
  categoryInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
    letterSpacing: -0.3,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    padding: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  habitsContainer: {
    paddingBottom: 12,
    gap: 0,
  },
});
