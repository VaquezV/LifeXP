import { useMemo } from 'react';
import { EMOTIONAL_STATE_CONFIG, COLOR_PALETTES, getEmotionalStateFromScore } from './config';
import { EmotionalState, AvatarState } from './types';

interface UseAvatarProps {
  score: number;
  accentColor?: string;
}

export const useAvatar = ({ score, accentColor = '#2a9d8f' }: UseAvatarProps) => {
  const state = getEmotionalStateFromScore(score);
  const config = EMOTIONAL_STATE_CONFIG[state];
  const colors = COLOR_PALETTES[state];

  const avatarState: AvatarState = useMemo(
    () => ({
      state,
      score,
      accentColor,
    }),
    [state, score, accentColor]
  );

  return {
    avatarState,
    state,
    config,
    colors,
    isExhausted: state === 'exhausted',
    isSad: state === 'sad',
    isNeutral: state === 'neutral',
    isContent: state === 'content',
    isHappy: state === 'happy',
    isEpic: state === 'epic',
    score,
  };
};
