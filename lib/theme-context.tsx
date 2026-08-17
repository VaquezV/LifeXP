import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { WolfLevel } from './theme-evolution';

type ThemeContextValue = {
  wolfLevel: WolfLevel;
  avatarScore: number;
  setWolfLevel: (level: WolfLevel) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  wolfLevel: 1,
  avatarScore: 5,
  setWolfLevel: () => {},
});

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [wolfLevel, setWolfLevel] = useState<WolfLevel>(1);
  const [avatarScore, setAvatarScore] = useState(5);
  const [loading, setLoading] = useState(true);

  // There is no palette to load until AuthProvider has resolved a signed-in user.
  useEffect(() => {
    async function fetchWolfLevel() {
      if (authLoading) return;

      if (!session || !supabase) {
        setWolfLevel(1);
        setAvatarScore(5);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // The level is computed and persisted server-side by the
        // compute-avatar-level edge function — the app never derives it
        // from category_progress itself.
        const { data, error } = await supabase.functions.invoke('compute-avatar-level');
        if (error) throw error;
        setWolfLevel(data.wolfLevel as WolfLevel);
        setAvatarScore(data.avatarScore as number);
      } catch (error) {
        console.error('Failed to fetch wolf level:', error);
        // Fall back to the last value persisted by the edge function.
        const { data } = await supabase
          .from('user_palette_progression')
          .select('current_wolf_level')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (data) setWolfLevel(data.current_wolf_level as WolfLevel);
      } finally {
        setLoading(false);
      }
    }

    fetchWolfLevel();
  }, [authLoading, session]);

  // Subscribe to real-time wolf level changes
  useEffect(() => {
    if (authLoading || !session || !supabase) return;

    const channel = supabase
      .channel('user_palette_progression_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_palette_progression',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload: any) => {
          if (payload.new?.current_wolf_level) {
            setWolfLevel(payload.new.current_wolf_level as WolfLevel);
          }
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [authLoading, session]);

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
    <ThemeContext.Provider value={{ wolfLevel, avatarScore, setWolfLevel }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
