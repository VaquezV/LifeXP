// app/(tabs)/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from '@/hooks/use-translation';
import { CheckinItemSimplified } from '@/components/checkin-item-simplified';
import { CategoryHeader } from '@/components/category-header';
import { ManageItemsModal } from '@/components/manage-items-modal';
import { WeekNavigator } from '@/components/week-navigator';
import { ThemedView } from '@/components/themed-view';
import { fetchHabits, createHabit, updateHabit, deleteHabit } from '@/lib/habits';
import { fetchPresetHabits } from '@/lib/preset-habits';
import { fetchAllLogsForDateRange, logHabitValue } from '@/lib/habit-logs';
import { fetchCategoryProgress, defaultAllCategoryProgress } from '@/lib/category-progress';
import { calcCategoryProjectedGain, fetchScoringConfig, getScoringConfigForLevel, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import { Habit, CategoryType, FrequencyType, PresetHabit, CATEGORY_KEYS, ScoringConfig } from '@/lib/types';
import { CATEGORY_TRANSLATION_KEY } from '@/lib/translations';
import { requireUserId } from '@/lib/auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { CategoryProgress } from '@/lib/types';

function getCategories(t: (key: any) => string): { key: CategoryType; label: string }[] {
  return CATEGORY_KEYS.map(key => ({ key, label: t(CATEGORY_TRANSLATION_KEY[key]) }));
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HomeScreen() {
  const { colors, styles: themeStyles } = useAppTheme();
  const { t } = useTranslation();
  const initialCategories = getCategories(t);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyValues, setDailyValues] = useState<Record<string, Record<string, number>>>({});
  const [categories, setCategories] = useState(initialCategories);
  const [categoryProgress, setCategoryProgress] = useState<Record<CategoryType, CategoryProgress> | null>(null);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>(SCORING_CONFIG_FALLBACK);
  const [managingCategory, setManagingCategory] = useState<CategoryType | null>(null);
  const [presets, setPresets] = useState<PresetHabit[]>([]);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(toDateKey(date));
    }
    return dates;
  }, [todayKey]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedHabits = await fetchHabits();
        setHabits(fetchedHabits);

        const fetchedPresets = await fetchPresetHabits().catch(() => []);
        setPresets(fetchedPresets);

        const weekLogs = await fetchAllLogsForDateRange(weekDates[0], weekDates[weekDates.length - 1]);
        setDailyValues(weekLogs);

        const [progress, configs] = await Promise.all([
          fetchCategoryProgress().catch(() => null),
          fetchScoringConfig().catch(() => SCORING_CONFIG_FALLBACK),
        ]);
        if (progress) setCategoryProgress(progress);
        if (configs.length) setScoringConfigs(configs);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [todayKey]);

  const handleValueChange = async (habitId: string, newValue: number) => {
    try {
      const habit = habits.find((item) => item.id === habitId);
      if (!habit) return;

      await logHabitValue(
        await requireUserId(),
        habitId,
        selectedDate,
        newValue,
        habit?.preset_habit_id ?? null
      );

      setDailyValues((prev) => ({
        ...prev,
        [selectedDate]: { ...(prev[selectedDate] ?? {}), [habitId]: newValue },
      }));
    } catch (error) {
      console.error('Error saving habit value:', error);
    }
  };

  const handleAddItem = async (category: CategoryType, newHabit: Partial<Habit>) => {
    try {
      const userId = await requireUserId();
      const habit = await createHabit({
        name: newHabit.name || 'Nouvel item',
        emoji: newHabit.emoji || '⭐',
        category: newHabit.category || category,
        frequency_type: newHabit.frequency_type || 'per_day',
        target_value: newHabit.target_value ?? 60,
        min_value: newHabit.min_value ?? 0,
        max_value: null,
        frequency_value: 1,
        preset_habit_id: newHabit.preset_habit_id ?? null,
        user_id: userId,
      });
      setHabits([...habits, habit]);
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const handleUpdateItem = async (habitId: string, updates: Partial<Habit>) => {
    try {
      const updated = await updateHabit(habitId, updates);
      if (updated) {
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h))
        );
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteItem = async (habitId: string) => {
    try {
      const success = await deleteHabit(habitId);
      if (success) {
        setHabits((prev) => prev.filter((h) => h.id !== habitId));
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.screen]}>
        <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const progress = categoryProgress ?? defaultAllCategoryProgress('');

  return (
    <SafeAreaView style={[styles.container, themeStyles.screen, { paddingTop: 8 }]}>
      <FlatList
        data={categories.map(cat => cat.key)}
        keyExtractor={item => item}
        extraData={{ dailyValues, habits, categoryProgress, scoringConfigs, selectedDate }}
        ListHeaderComponent={
          <WeekNavigator
            weekDates={weekDates}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            todayKey={todayKey}
          />
        }
        renderItem={({ item }) => {
          const category = item as CategoryType;
          const catData = categories.find(c => c.key === category);
          const categoryLabel = catData?.label ?? category;
          const catProgress = progress[category];
          const categoryHabits = habits.filter(h => h.category === category);
          const scoringConfig = getScoringConfigForLevel(scoringConfigs, catProgress.current_level + 1);
          const projectedGain = calcCategoryProjectedGain(categoryHabits, dailyValues, scoringConfig);

          return (
            <ThemedView key={category} style={[styles.section, themeStyles.surface]}>
              {/* Category Header - usando el componente existente */}
              <CategoryHeader
                category={category}
                categoryLabel={categoryLabel}
                categoryLevel={catProgress.current_level}
                pointsInLevel={catProgress.points_in_level}
                projectedGain={projectedGain}
                maintenanceCost={scoringConfig.daily_maintenance}
                onManageItems={() => setManagingCategory(category)}
              />

              {/* Checkin Items */}
              <ThemedView style={styles.itemsContainer}>
                {categoryHabits.map((habit) => (
                  <CheckinItemSimplified
                    key={habit.id}
                    habit={habit}
                    value={dailyValues[selectedDate]?.[habit.id] || 0}
                    onValueChange={(newValue) =>
                      handleValueChange(habit.id, newValue)
                    }
                  />
                ))}
              </ThemedView>
            </ThemedView>
          );
        }}
        scrollEnabled={true}
        contentContainerStyle={[styles.scrollContent, themeStyles.screen]}
      />

      {/* Manage Items Modal */}
      {managingCategory && (
        <ManageItemsModal
          visible={managingCategory !== null}
          category={managingCategory}
          presets={presets}
          habits={habits.filter((h) => h.category === managingCategory)}
          onClose={() => setManagingCategory(null)}
          onAdd={(newHabit) => handleAddItem(managingCategory, newHabit)}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  section: {
    marginBottom: 12,
    marginHorizontal: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  itemsContainer: {
    paddingHorizontal: 0,
  },
});
