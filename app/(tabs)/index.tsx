// app/(tabs)/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from '@/hooks/use-translation';
import { HeroBanner } from '@/components/hero-banner';
import { CategorySection } from '@/components/category-section';
import { fetchHabits, createHabit } from '@/lib/habits';
import { fetchAllLogsForDate, logHabitValue } from '@/lib/habit-logs';
import { calculateDayCompletion } from '@/lib/scoring';
import { Habit, CategoryType, FrequencyType, PresetHabit, CATEGORY_KEYS, ScoringConfig } from '@/lib/types';
import { CATEGORY_TRANSLATION_KEY } from '@/lib/translations';
import { requireUserId } from '@/lib/auth';
import { AddHabitModal } from '@/components/add-habit-modal';
import { fetchPresetHabits } from '@/lib/preset-habits';
import { useAppTheme } from '@/hooks/use-app-theme';
import { fetchCategoryProgress, defaultAllCategoryProgress } from '@/lib/category-progress';
import { fetchScoringConfig, getScoringConfigForLevel, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import { getAvatarScoreFromLevels } from '@/lib/avatar-level';
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

function getWeekDayAbbr(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return ['DI', 'LU', 'MA', 'ME', 'JE', 'VE', 'SA'][date.getDay()];
}

export default function HomeScreen() {
  const { colors, styles: themeStyles } = useAppTheme();
  const { t } = useTranslation();
  const initialCategories = getCategories(t);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyValues, setDailyValues] = useState<Record<string, Record<string, number>>>({});
  const [categories, setCategories] = useState(initialCategories);
  const [presets, setPresets] = useState<PresetHabit[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<CategoryType>('self_care');
  const [categoryProgress, setCategoryProgress] = useState<Record<CategoryType, CategoryProgress> | null>(null);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>(SCORING_CONFIG_FALLBACK);

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i);
      dates.push(toDateKey(date));
    }
    return dates;
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const weekDays = useMemo(
    () =>
      weekDates.map(date => ({
        abbr: getWeekDayAbbr(date),
        date: new Date(`${date}T12:00:00`).getDate().toString().padStart(2, '0'),
        completion: calculateDayCompletion(habits, dailyValues[date] ?? {}),
        isToday: date === todayKey,
      })),
    [dailyValues, habits, todayKey, weekDates]
  );

  const avatarScore = useMemo(() => {
    if (!categoryProgress) return 5;
    const levels = Object.fromEntries(
      CATEGORY_KEYS.map(cat => [cat, categoryProgress[cat].current_level])
    ) as Record<CategoryType, number>;
    return getAvatarScoreFromLevels(levels);
  }, [categoryProgress]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedHabits, fetchedPresets] = await Promise.all([
          fetchHabits(),
          fetchPresetHabits(),
        ]);
        setHabits(fetchedHabits);
        setPresets(fetchedPresets);

        const weekLogs: Record<string, Record<string, number>> = {};
        for (const date of weekDates) {
          weekLogs[date] = await fetchAllLogsForDate(date);
        }
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
  }, [weekDates]);

  const handleValueChange = async (habitId: string, date: string, value: number) => {
    try {
      const habit = habits.find(item => item.id === habitId);
      await logHabitValue(
        await requireUserId(),
        habitId,
        date,
        value,
        habit?.preset_habit_id ?? null,
      );
      setDailyValues(prev => ({
        ...prev,
        [date]: { ...(prev[date] ?? {}), [habitId]: value },
      }));
    } catch (error) {
      console.error('Error saving habit value:', error);
    }
  };

  const handleHabitUpdate = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const handleHabitDelete = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  const handleAddHabit = async (habitData: {
    name: string;
    emoji: string;
    category: CategoryType;
    frequency_type: FrequencyType;
    target_value: number;
    min_value: number;
    preset_habit_id: string | null;
  }) => {
    const userId = await requireUserId();
    const newHabit = await createHabit({
      ...habitData,
      user_id: userId,
      max_value: null,
      frequency_value: 1,
    });
    setHabits(prev => [...prev, newHabit]);
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
        data={['hero-banner', ...categories.map(cat => cat.key)]}
        keyExtractor={item => item}
        renderItem={({ item }) => {
          if (item === 'hero-banner') {
            return (
              <HeroBanner
                avatarScore={avatarScore}
                weekDays={weekDays}
              />
            );
          }

          const category = item as CategoryType;
          const catData = categories.find(c => c.key === category);
          const categoryLabel = catData?.label ?? category;
          const catProgress = progress[category];
          const config = getScoringConfigForLevel(scoringConfigs, catProgress.current_level);

          const handleUpdateCategory = (newLabel: string) => {
            setCategories(prev =>
              prev.map(c => c.key === category ? { ...c, label: newLabel } : c)
            );
          };

          return (
            <CategorySection
              key={category}
              category={category}
              categoryLabel={categoryLabel}
              categoryLevel={catProgress.current_level}
              pointsInLevel={catProgress.points_in_level}
              maxHabits={config.max_habits}
              habits={habits}
              weekDates={weekDates}
              weekValues={dailyValues}
              onHabitValueChange={handleValueChange}
              onHabitUpdate={handleHabitUpdate}
              onHabitDelete={handleHabitDelete}
              onAddHabit={() => {
                setAddModalCategory(category);
                setAddModalVisible(true);
              }}
              onUpdateCategory={handleUpdateCategory}
            />
          );
        }}
        scrollEnabled={true}
        contentContainerStyle={[styles.scrollContent, themeStyles.screen]}
      />
      <AddHabitModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddHabit}
        presets={presets}
        defaultCategory={addModalCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
});
