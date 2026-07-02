// lib/hooks/use-palette-transition.ts

import { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { EasingFunction } from 'react-native-reanimated/lib/typescript/commonTypes';

export interface PaletteTransitionConfig {
  duration?: number; // Default 400ms
  easing?: EasingFunction;
  onComplete?: () => void;
}

export function usePaletteTransition(
  currentLevel: number,
  previousLevel: number = 1,
  config: PaletteTransitionConfig = {}
) {
  const {
    duration = 400,
    easing: customEasing = Easing.inOut(Easing.ease),
    onComplete,
  } = config;

  const transitionProgress = useSharedValue(0);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Only trigger animation if level actually changed
    if (currentLevel !== previousLevel && !hasTriggered.current) {
      hasTriggered.current = true;
      transitionProgress.value = withTiming(1, {
        duration,
        easing: customEasing,
      }, () => {
        if (onComplete) {
          runOnJS(onComplete)();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, previousLevel]);

  return {
    transitionProgress,
  };
}
