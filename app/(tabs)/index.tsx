// lifexp/app/(tabs)/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Text,
} from 'react-native';
import { useTranslation } from '@/hooks/use-translation';
import { HeroBanner } from '@/components/hero-banner';
import { CategorySection } from '@/components/category-section';
import { fetchHabits, createHabit } from '@/lib/habits';
import { fetchAllLogsForDate, logHabitValue } from '@/lib/habit-logs';
import {
  calculateDayCompletion,
  calculateWeeklyScore,
  calculateCategoryCompletion,
} from '@/lib/scoring';
import { Habit, CategoryType, FrequencyType, PresetHabit, CATEGORY_KEYS } from '@/lib/types';
import { CATEGORY_TRANSLATION_KEY } from '@/lib/translations';
import { requireUserId } from '@/lib/auth';
import { AddHabitModal } from '@/components/add-habit-modal';
import { fetchPresetHabits } from '@/lib/preset-habits';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { fetchMomentum, defaultMomentumRecord, MomentumRecord } from '@/lib/momentum-db';
import { getAccessoryDisplayState, MomentumTrend } from '@/lib/momentum';

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
  const [dailyValues, setDailyValues] = useState<
    Record<string, Record<string, number>>
  >({});
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [categories, setCategories] = useState(initialCategories);
  const [presets, setPresets] = useState<PresetHabit[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [momentumRecord, setMomentumRecord] = useState<MomentumRecord | null>(null);

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

  const categoryCompletions = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_KEYS.map(cat => [
          cat,
          calculateCategoryCompletion(habits, dailyValues, cat),
        ])
      ) as Record<CategoryType, number>,
    [habits, dailyValues]
  );

  const TREND_COL: Record<CategoryType, keyof MomentumRecord> = {
    self_care:     'trend_selfcare',
    dev_perso:     'trend_devperso',
    vie_familiale: 'trend_famille',
    vie_pro:       'trend_pro',
  };

  const categoryDisplayState = useMemo(() => {
    const rec = momentumRecord ?? defaultMomentumRecord('');
    return Object.fromEntries(
      CATEGORY_KEYS.map(cat => {
        const score = categoryCompletions[cat];
        const t = rec[TREND_COL[cat]] as MomentumTrend;
        return [cat, getAccessoryDisplayState(cat, score, t)];
      })
    ) as Record<CategoryType, ReturnType<typeof getAccessoryDisplayState>>;
  }, [momentumRecord, categoryCompletions]);

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

        const record = await fetchMomentum().catch(() => null);
        setMomentumRecord(record);

        const score = calculateWeeklyScore(fetchedHabits, weekLogs);
        setWeeklyScore(score);
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
      const habit = habits.find((item) => item.id === habitId);
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

  useEffect(() => {
    const score = calculateWeeklyScore(habits, dailyValues);
    setWeeklyScore(score);
  }, [dailyValues, habits]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.screen]}>
        <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themeStyles.screen, { paddingTop: 8 }]}>
      <FlatList
        data={['hero-banner', ...categories.map(cat => cat.key), 'add-habit']}
        keyExtractor={item => item}
        renderItem={({ item }) => {
          if (item === 'hero-banner') {
            return (
              <HeroBanner
                weeklyScore={weeklyScore}
                weekDays={weekDays}
              />
            );
          }

          if (item === 'add-habit') {
            return (
              <Pressable
                style={[styles.addHabitButton, themeStyles.surfaceRaised]}
                onPress={() => setAddModalVisible(true)}
              >
                <MaterialIcons name="add-circle-outline" size={28} color={colors.icon} />
                <Text style={[styles.addHabitText, { color: colors.textMuted }]}>
                  Ajouter une nouvelle habitude
                </Text>
              </Pressable>
            );
          }

          const category = item as CategoryType;
          const catData = categories.find(c => c.key === category);
          const categoryLabel = catData?.label ?? category;

          const handleUpdateCategory = (newLabel: string, newColor: string) => {
            setCategories(prev =>
              prev.map(c => c.key === category ? { ...c, label: newLabel } : c)
            );
          };

          const { overlayHeight, overlayColor } = categoryDisplayState[category];

          return (
            <CategorySection
              key={category}
              category={category}
              categoryLabel={categoryLabel}
              completionPct={categoryCompletions[category]}
              habits={habits}
              weekDates={weekDates}
              weekValues={dailyValues}
              onHabitValueChange={handleValueChange}
              onHabitUpdate={handleHabitUpdate}
              onHabitDelete={handleHabitDelete}
              onAddHabit={handleAddHabit}
              onUpdateCategory={handleUpdateCategory}
              score={categoryCompletions[category]}
              overlayHeight={overlayHeight}
              overlayColor={overlayColor}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginVertical: 10,
    paddingVertical: 16,
    borderRadius: 8,
  },
  addHabitText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
