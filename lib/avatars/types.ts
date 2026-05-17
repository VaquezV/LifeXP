export type EmotionalState = 'exhausted' | 'sad' | 'neutral' | 'content' | 'happy' | 'epic';

export interface AvatarState {
  state: EmotionalState;
  score: number;
  accentColor: string;
}

export interface AvatarConfig {
  name: string;
  emotionalStates: Record<EmotionalState, {
    scoreRange: [number, number];
    label: string;
    description: string;
  }>;
}

export interface SVGAvatarSource {
  id: string;
  name: string;
  version: string;
  emotionalStates: Record<EmotionalState, string>; // SVG file paths or names
}
