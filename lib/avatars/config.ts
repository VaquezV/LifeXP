import { AvatarConfig, EmotionalState } from './types';

export const EMOTIONAL_STATE_CONFIG: Record<EmotionalState, {
  scoreRange: [number, number];
  label: string;
  description: string;
}> = {
  exhausted: {
    scoreRange: [0, 20],
    label: 'Exhausted',
    description: 'Barely alive',
  },
  sad: {
    scoreRange: [20, 40],
    label: 'Sad',
    description: 'Low energy',
  },
  neutral: {
    scoreRange: [40, 60],
    label: 'Neutral',
    description: 'Meh',
  },
  content: {
    scoreRange: [60, 80],
    label: 'Content',
    description: 'Small smile',
  },
  happy: {
    scoreRange: [80, 95],
    label: 'Happy',
    description: 'Energetic',
  },
  epic: {
    scoreRange: [95, 100],
    label: 'EPIC',
    description: 'Maximum hype!',
  },
};

export const getEmotionalStateFromScore = (score: number): EmotionalState => {
  if (score < 20) return 'exhausted';
  if (score < 40) return 'sad';
  if (score < 60) return 'neutral';
  if (score < 80) return 'content';
  if (score < 95) return 'happy';
  return 'epic';
};

export const GOT_AVATAR_RANGES = [
  { min: 0, max: 10, svgFile: 'got.0-10.svg', name: 'Theon Greyjoy' },
  { min: 11, max: 20, svgFile: 'got.11-20.svg', name: 'Sansa Stark' },
  { min: 21, max: 30, svgFile: 'got.21-30.svg', name: 'Tyrion Lannister' },
  { min: 31, max: 40, svgFile: 'got.31-40.svg', name: 'Arya Stark' },
  { min: 41, max: 50, svgFile: 'got.41-50.svg', name: 'Jon Snow' },
  { min: 51, max: 60, svgFile: 'got.51-60.svg', name: 'Brienne of Tarth' },
  { min: 61, max: 70, svgFile: 'got.61-70.svg', name: 'Davos Seaworth' },
  { min: 71, max: 80, svgFile: 'got.71-80.svg', name: 'Jaime Lannister' },
  { min: 81, max: 90, svgFile: 'got.81-90.svg', name: 'Daenerys Targaryen' },
  { min: 91, max: 100, svgFile: 'got.91-100.svg', name: 'Dragon of the North' },
] as const;

export const DOG_AVATAR_RANGES = GOT_AVATAR_RANGES;

export const getAvatarByScore = (score: number) => {
  const normalized = Math.min(100, Math.max(0, score));
  const range = DOG_AVATAR_RANGES.find(r => normalized >= r.min && normalized <= r.max);
  return range || DOG_AVATAR_RANGES[DOG_AVATAR_RANGES.length - 1];
};

export const COLOR_PALETTES = {
  exhausted: {
    body: '#8b3a3a',
    stroke: '#c62828',
    accent: '#c62828',
  },
  sad: {
    body: '#7a5c7c',
    stroke: '#9575b0',
    accent: '#9575b0',
  },
  neutral: {
    body: '#6b7a8a',
    stroke: '#8a9aaa',
    accent: '#8a9aaa',
  },
  content: {
    body: '#4a9b7f',
    stroke: '#7dbfb0',
    accent: '#5fdd9b',
  },
  happy: {
    body: '#2ec573',
    stroke: '#5fdd9b',
    accent: '#2ec573',
  },
  epic: {
    body: '#00ff88',
    stroke: '#7fffd4',
    accent: '#00ff88',
  },
} as const;
