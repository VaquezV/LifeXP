// components/category-section.tsx
import { CATEGORY_COLORS } from '@/constants/Colors';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  ACCESSORY_LABELS,
  CATEGORY_CURRENCY_NAMES,
  getAccessoryTierLabel,
  formatPoints,
} from '@/lib/accessoires';
import { CategoryType, Habit } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, ToastAndroid, View, Alert } from 'react-native';
import { AccessoryIcon } from './accessory-icon';
import { CategoryModal } from './category-modal';
import { HabitCard } from './habit-card';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export interface CategorySectionProps {
  category: CategoryType;
  categoryLabel: string;
  categoryLevel: number;
  pointsInLevel: number;
  maxHabits: number;
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
  maxHabits,
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
  const accentColor = categoryColor.mid;
  const categoryHabits = habits.filter(h => h.category === category);
  const habitCount = categoryHabits.length;
  const hasSlot = habitCount < maxHabits;

  const currencyName = CATEGORY_CURRENCY_NAMES[category];
  const tierLabel = getAccessoryTierLabel(categoryLevel);
  const accessoryLabel = ACCESSORY_LABELS[category];
  const pointsDisplay = formatPoints(pointsInLevel, currencyName);
  const levelDisplay = `N${categoryLevel} · ${tierLabel}`;

  useEffect(() => {
    if (!hasSlot) { pulseAnim.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [hasSlot]);

  function handleAddPress() {
    if (!onAddHabit) return;
    if (hasSlot) {
      onAddHabit();
    } else {
      const msg = categoryLevel < 5
        ? `Niveau N${categoryLevel + 1} requis pour ajouter une habitude ici`
        : 'Niveau maximum atteint pour cette catégorie';
      showToast(msg);
    }
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
      <View style={styles.header}>
        <Pressable
          onPress={onAccessoryPress}
          style={[styles.accessoryWrapper, { borderColor: accentColor + '44' }]}
          accessibilityRole="button"
          accessibilityLabel={`${accessoryLabel} — ${tierLabel}`}
        >
          <AccessoryIcon
            category={category}
            level={categoryLevel}
            size={48}
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
                  <MaterialIcons name="edit" size={16} color={accentColor} />
                </Pressable>
              )}
              {onAddHabit && (
                <Pressable onPress={handleAddPress} style={styles.iconButton} accessibilityRole="button">
                  <Animated.View style={{ transform: [{ scale: hasSlot ? pulseAnim : 1 }] }}>
                    <MaterialIcons
                      name={hasSlot ? 'add-circle' : 'lock'}
                      size={20}
                      color={hasSlot ? accentColor : colors.textSubtle}
                    />
                  </Animated.View>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <ThemedText style={[styles.pointsText, { color: accentColor }]}>
              {pointsDisplay}
            </ThemedText>
            <ThemedText style={[styles.levelText, { color: colors.textSubtle }]}>
              {levelDisplay}
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
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelText: {
    fontSize: 10,
  },
  habitsContainer: {
    paddingBottom: 12,
  },
});
