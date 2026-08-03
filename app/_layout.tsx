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
import { fetchWolfName } from '@/lib/profiles';

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

      {/* Celebration modal */}
      {levelChangeInfo && (
        <CelebrationModal
          visible={showCelebration}
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
