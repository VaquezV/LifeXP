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
import { AppHeader } from '@/components/app-header';
import { WeekSummary } from '@/components/week-summary';
import { CategorySection } from '@/components/category-section';
import { fetchHabits, createHabit } from '@/lib/habits';
import { fetchAllLogsForDate, logHabitValue } from '@/lib/habit-logs';
import { calculateDayCompletion, calculateWeeklyScore } from '@/lib/scoring';
import { Habit, CategoryType, FrequencyType, PresetHabit } from '@/lib/types';
import { requireUserId } from '@/lib/auth';
import { AddHabitModal } from '@/components/add-habit-modal';
import { fetchPresetHabits } from '@/lib/preset-habits';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '@/hooks/use-app-theme';

function getCategories(t: any): { key: CategoryType; label: string }[] {
  return [
    { key: 'self_care', label: t('selfCare') },
    { key: 'dev_perso', label: t('personalDev') },
    { key: 'vie_familiale', label: t('familyLife') },
    { key: 'vie_pro', label: t('professional') },
  ];
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
  >({}); // date -> (habit_id -> value)
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [categories, setCategories] = useState(initialCategories);
  const [presets, setPresets] = useState<PresetHabit[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Get last 7 days ending today
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
      weekDates.map(date => {
        const completion = calculateDayCompletion(habits, dailyValues[date] ?? {});

        return {
          abbr: getWeekDayAbbr(date),
          date: new Date(`${date}T12:00:00`).getDate().toString().padStart(2, '0'),
          completion,
          isToday: date === todayKey,
        };
      }),
    [dailyValues, habits, todayKey, weekDates]
  );

  // Load habits and logs
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

        // Load logs for this week
        const weekLogs: Record<string, Record<string, number>> = {};
        for (const date of weekDates) {
          weekLogs[date] = await fetchAllLogsForDate(date);
        }
        setDailyValues(weekLogs);

        // Calculate weekly score
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

      // Update local state (score recalculation handled by useEffect)
      setDailyValues(prev => ({
        ...prev,
        [date]: {
          ...(prev[date] ?? {}),
          [habitId]: value,
        },
      }));
    } catch (error) {
      console.error('Error saving habit value:', error);
    }
  };

  const handleHabitUpdate = (updatedHabit: Habit) => {
    setHabits(prev =>
      prev.map(h => h.id === updatedHabit.id ? updatedHabit : h)
    );
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

  // Recalculate weekly score whenever dailyValues or habits change
  useEffect(() => {
    const score = calculateWeeklyScore(habits, dailyValues);
    setWeeklyScore(score);
  }, [dailyValues, habits]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, themeStyles.screen]}
      >
        <ActivityIndicator
          size="large"
          color={colors.tint}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, themeStyles.screen, { paddingTop: 8 }]}
    >
      <FlatList
        data={['app-header', 'week-header', ...categories.map(cat => cat.key), 'add-habit']}
        keyExtractor={item => item}
        renderItem={({ item }) => {
          if (item === 'app-header') {
            return <AppHeader />;
          }

          if (item === 'week-header') {
            return habits.length > 0 ? (
              <WeekSummary
                weekDays={weekDays}
                weeklyCompletion={weeklyScore}
                accentColor={colors.tint}
              />
            ) : null;
          }

          if (item === 'add-habit') {
            return (
              <Pressable
                style={[
                  styles.addHabitButton,
                  themeStyles.surfaceRaised,
                ]}
                onPress={() => setAddModalVisible(true)}
              >
                <MaterialIcons
                  name="add-circle-outline"
                  size={28}
                  color={colors.icon}
                />
                <Text style={[styles.addHabitText, { color: colors.textMuted }]}>
                  Ajouter une nouvelle habitude
                </Text>
              </Pressable>
            );
          }

          const category = item as CategoryType;
          const categoryHabits = habits.filter(h => h.category === category);
          const catData = categories.find(c => c.key === category);
          const categoryLabel = catData?.label || category;

          const handleUpdateCategory = (newLabel: string, newColor: string) => {
            setCategories(prev =>
              prev.map(c =>
                c.key === category ? { ...c, label: newLabel } : c
              )
            );
          };

          return (
            <CategorySection
              key={category}
              category={category}
              categoryLabel={categoryLabel}
              habits={categoryHabits}
              weekDates={weekDates}
              weekValues={dailyValues}
              onHabitValueChange={handleValueChange}
              onHabitUpdate={handleHabitUpdate}
              onHabitDelete={handleHabitDelete}
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
