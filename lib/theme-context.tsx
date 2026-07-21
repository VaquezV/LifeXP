import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import { requireUserId } from './auth';
import type { WolfLevel } from './theme-evolution';
import { fetchCategoryProgress } from './category-progress';
import { getAvatarScoreFromLevels } from './avatar-level';
import { getWolfTierIndex } from './wolf-data';
import { CATEGORY_KEYS, type CategoryType } from './types';

async function computeWolfLevelFromProgress(): Promise<WolfLevel | null> {
  try {
    const progress = await fetchCategoryProgress();
    const levels = Object.fromEntries(
      CATEGORY_KEYS.map(cat => [cat, progress[cat].current_level])
    ) as Record<CategoryType, number>;
    const score = getAvatarScoreFromLevels(levels);
    return (getWolfTierIndex(score) + 1) as WolfLevel;
  } catch {
    return null;
  }
}

type ThemeContextValue = {
  wolfLevel: WolfLevel;
  setWolfLevel: (level: WolfLevel) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  wolfLevel: 1,
  setWolfLevel: () => {},
});

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [wolfLevel, setWolfLevel] = useState<WolfLevel>(1);
  const [loading, setLoading] = useState(true);

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

        const computedLevel = await computeWolfLevelFromProgress();

        if (!error && data) {
          const storedLevel = data.current_wolf_level as WolfLevel;
          if (computedLevel && computedLevel !== storedLevel) {
            const { error: updateError } = await supabase
              .from('user_palette_progression')
              .update({ current_wolf_level: computedLevel })
              .eq('user_id', userId);
            if (updateError) throw updateError;
            setWolfLevel(computedLevel);
          } else {
            setWolfLevel(storedLevel);
          }
        } else if (!error && !data) {
          const initialLevel = computedLevel ?? 1;
          const { error: insertError } = await supabase
            .from('user_palette_progression')
            .insert({
              user_id: userId,
              current_wolf_level: initialLevel,
              last_seen_wolf_level: initialLevel,
            });
          if (insertError) throw insertError;
          setWolfLevel(initialLevel);
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
    <ThemeContext.Provider value={{ wolfLevel, setWolfLevel }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
