import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth, requireUserId } from '@/lib/auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemeContextProvider } from '@/lib/theme-context';
import { supabase } from '@/lib/supabase';
import { CelebrationModal } from '@/components/celebration-modal';
import { AccessoryChangeModal } from '@/components/accessory-change-modal';
import { fetchWolfName } from '@/lib/profiles';
import { fetchCategoryProgress } from '@/lib/category-progress';
import { fetchScoringConfig, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import { computeAccessoryDiff, type AccessoryDiffItem, type CategorySnapshot } from '@/lib/accessory-diff';
import { CATEGORY_KEYS } from '@/lib/types';

const Analytics = Platform.OS === 'web' ? require('@vercel/analytics/react').Analytics : null;

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors, styles: themeStyles } = useAppTheme();
  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.tint,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  const [showCelebration, setShowCelebration] = useState(false);
  const [levelChangeInfo, setLevelChangeInfo] = useState<{
    oldLevel: number;
    newLevel: number;
    wolfName: string;
  } | null>(null);

  const [accessoryQueue, setAccessoryQueue] = useState<
    { direction: 'gained' | 'lost'; items: AccessoryDiffItem[] }[]
  >([]);
  const [accessorySeenState, setAccessorySeenState] = useState<CategorySnapshot[]>([]);

  // Check for accessory gains/losses since the last time the user saw this modal
  useEffect(() => {
    async function checkAccessoryChanges() {
      try {
        if (!supabase) return;

        const progress = await fetchCategoryProgress();
        let scoringConfigs;
        try {
          scoringConfigs = await fetchScoringConfig();
        } catch {
          scoringConfigs = SCORING_CONFIG_FALLBACK;
        }

        const before: CategorySnapshot[] = CATEGORY_KEYS.map(category => ({
          category,
          level: progress[category].last_seen_level,
          pointsInLevel: progress[category].last_seen_points_in_level,
        }));
        const after: CategorySnapshot[] = CATEGORY_KEYS.map(category => ({
          category,
          level: progress[category].current_level,
          pointsInLevel: progress[category].points_in_level,
        }));

        const { gained, lost } = computeAccessoryDiff(before, after, scoringConfigs);
        const queue: { direction: 'gained' | 'lost'; items: AccessoryDiffItem[] }[] = [];
        if (gained.length > 0) queue.push({ direction: 'gained', items: gained });
        if (lost.length > 0) queue.push({ direction: 'lost', items: lost });

        if (queue.length > 0) {
          setAccessoryQueue(queue);
          setAccessorySeenState(after);
        }
      } catch (error) {
        console.error('Failed to check accessory changes:', error);
      }
    }

    if (session) {
      checkAccessoryChanges();
    }
  }, [session]);

  const handleAccessoryModalContinue = async () => {
    const [, ...rest] = accessoryQueue;
    if (rest.length > 0) {
      setAccessoryQueue(rest);
      return;
    }

    setAccessoryQueue([]);

    try {
      const userId = await requireUserId();
      if (!supabase) return;

      await Promise.all(
        accessorySeenState.map(snap =>
          supabase!
            .from('category_progress')
            .update({ last_seen_level: snap.level, last_seen_points_in_level: snap.pointsInLevel })
            .eq('user_id', userId)
            .eq('category', snap.category)
        )
      );
    } catch (error) {
      console.error('Failed to update accessory seen state:', error);
    }
  };

  useEffect(() => {
    if (loading) return;
    const inAuthFlow = segments[0] === 'login' || segments[0] === 'auth';
    if (!session && !inAuthFlow) {
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      router.replace('/');
    }
  }, [session, loading, segments, router]);

  // Check for level changes and show celebration modal
  useEffect(() => {
    async function checkLevelChange() {
      try {
        const userId = await requireUserId();
        if (!supabase) return;

        const { data } = await supabase
          .from('user_palette_progression')
          .select('current_wolf_level, last_seen_wolf_level')
          .eq('user_id', userId)
          .single();

        if (data && data.current_wolf_level > data.last_seen_wolf_level) {
          // Level advanced!
          const wolfName = await fetchWolfName();
          setLevelChangeInfo({
            oldLevel: data.last_seen_wolf_level,
            newLevel: data.current_wolf_level,
            wolfName,
          });
          setShowCelebration(true);
        }
      } catch (error) {
        console.error('Failed to check level change:', error);
      }
    }

    if (session) {
      checkLevelChange();
    }
  }, [session]);

  const handleCelebrationComplete = async () => {
    if (!levelChangeInfo) return;

    try {
      const userId = await requireUserId();
      if (!supabase) return;

      // Update last_seen_wolf_level
      await supabase
        .from('user_palette_progression')
        .update({ last_seen_wolf_level: levelChangeInfo.newLevel })
        .eq('user_id', userId);

      setShowCelebration(false);
      setLevelChangeInfo(null);
    } catch (error) {
      console.error('Failed to update level progression:', error);
      setShowCelebration(false);
    }
  };

  if (loading) {
    return (
      <View style={[themeStyles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <>
      <ThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>

      {/* Accessory gain/loss modal(s) — shown before the celebration modal */}
      {accessoryQueue.length > 0 && (
        <AccessoryChangeModal
          visible
          direction={accessoryQueue[0].direction}
          items={accessoryQueue[0].items}
          onContinue={handleAccessoryModalContinue}
        />
      )}

      {/* Celebration modal — deferred until the accessory queue has drained */}
      {levelChangeInfo && (
        <CelebrationModal
          visible={showCelebration && accessoryQueue.length === 0}
          wolfName={levelChangeInfo.wolfName}
          oldAvatarScore={levelChangeInfo.oldLevel * 10}  // Converts level (1-10) to score (10-100)
          newAvatarScore={levelChangeInfo.newLevel * 10}  // Converts level (1-10) to score (10-100)
          onContinue={handleCelebrationComplete}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeContextProvider>
        <RootNavigator />
        {Analytics && <Analytics />}
      </ThemeContextProvider>
    </AuthProvider>
  );
}
