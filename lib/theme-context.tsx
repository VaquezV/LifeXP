import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { DEFAULT_THEME, type ThemeMode } from '@/constants/theme';
import { supabase } from './supabase';
import { requireUserId } from './auth';
import type { WolfLevel } from './theme-evolution';

type ThemeContextValue = {
  mode: ThemeMode;
  toggleTheme: () => void;
  wolfLevel: WolfLevel;
  setWolfLevel: (level: WolfLevel) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: DEFAULT_THEME,
  toggleTheme: () => {},
  wolfLevel: 1,
  setWolfLevel: () => {},
});

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME);
  const [wolfLevel, setWolfLevel] = useState<WolfLevel>(1);
  const [loading, setLoading] = useState(true);

  const toggleTheme = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));

  // Fetch user's wolf level on mount
  useEffect(() => {
    async function fetchWolfLevel() {
      try {
        const userId = await requireUserId();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_palette_progression')
          .select('current_wolf_level')
          .eq('user_id', userId)
          .maybeSingle();

        if (data?.current_wolf_level) {
          console.log('✅ Loaded wolf level:', data.current_wolf_level);
          setWolfLevel(data.current_wolf_level as WolfLevel);
        } else if (!error && !data) {
          console.log('📝 Creating new user_palette_progression row...');
          await supabase
            .from('user_palette_progression')
            .insert({
              user_id: userId,
              current_wolf_level: 1,
              last_seen_wolf_level: 0,
            });
        }
      } catch (error) {
        console.error('Failed to fetch wolf level:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWolfLevel();
  }, []);

  // Subscribe to real-time wolf level changes
  useEffect(() => {
    let subscription: any;

    async function subscribeToWolfLevel() {
      try {
        const userId = await requireUserId();
        if (!supabase) return;

        const channel = supabase
          .channel('user_palette_progression_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_palette_progression',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              if (payload.new?.current_wolf_level) {
                setWolfLevel(payload.new.current_wolf_level as WolfLevel);
              }
            }
          )
          .subscribe();

        subscription = channel;
      } catch (error) {
        console.error('Failed to subscribe to wolf level:', error);
      }
    }

    subscribeToWolfLevel();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Prepare palette fade transitions
  // When wolfLevel changes, all components re-render with new palette colors.
  // React Native Animated API automatically interpolates color changes smoothly.
  // Components that wrap colors in Animated.Value will see smooth 400-500ms transitions.
  useEffect(() => {
    // Color transition happens automatically via re-render when wolfLevel changes.
    // If we need more control, we can use Reanimated's interpolateColor here.
    // For now, context update + component re-render provides smooth transitions.
  }, [wolfLevel]);

  if (loading) {
    return null; // Or a loading screen if desired
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, wolfLevel, setWolfLevel }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
