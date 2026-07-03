// lib/theme-evolution.ts

import type { ThemeColors } from '@/constants/theme';

export type WolfLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface PaletteColors {
  // Primary surfaces
  bgPrimary: string;
  bgSecondary: string;
  surface: string;
  surfaceRaised: string;
  surfaceAlt: string;

  // Text
  text: string;
  textMuted: string;
  textSubtle: string;
  textStrong?: string;

  // Accents & Status
  tint: string;
  tintSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  danger: string;
  dangerSoft: string;

  // UI Elements
  icon: string;
  border: string;
  borderStrong: string;
  borderSoft: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  // Advanced
  overlay: string;
  cardBorder: string;
  tabBarBackground: string;
  tabBarBorder: string;
}

export interface PaletteDepth {
  shadowElevation1: string; // Subtle: rgba(x, y, z, 0.1-0.2)
  shadowElevation2: string; // Medium: rgba(x, y, z, 0.2-0.3)
  shadowElevation3: string; // Strong: rgba(x, y, z, 0.3-0.5)
  shadowColor: string; // Base shadow hue
}

export interface PaletteShapes {
  borderRadiusBase: number; // Base border radius in pixels
  borderRadiusLg: number; // Larger radius for rounder elements
  borderRadiusXl: number; // Extra large for organic curves
}

export interface PaletteProperties {
  saturation: number; // 0-100%, intensity of colors
  warmth: number; // 0-100%, cool (0) to warm (100)
}

export interface Palette extends PaletteColors, PaletteDepth, PaletteShapes, PaletteProperties {
  name: string;
  description: string;
}

export type PaletteMap = Record<WolfLevel, Palette>;

// Level 1: Ombre Fermée
const LEVEL_1_OMBRE_FERMEE: Palette = {
  name: 'Ombre Fermée',
  description: 'Dark, closed, minimal light',
  bgPrimary: '#000000',
  bgSecondary: '#0a0a0a',
  surface: '#0a0a0a',
  surfaceRaised: '#151515',
  surfaceAlt: '#0f0f0f',
  text: '#e0e0e0',
  textMuted: '#b0b0b0',
  textSubtle: '#555555',
  tint: '#7a6a5a',
  tintSoft: '#6a4a4a',
  success: '#4a9a4a',
  successSoft: '#3a6a3a',
  warning: '#8b5a2b',
  danger: '#8b3a3a',
  dangerSoft: '#6a2a2a',
  icon: '#555555',
  border: '#1a1a1a',
  borderStrong: '#0f0f0f',
  borderSoft: '#2a2a2a',
  inputBackground: '#151515',
  inputBorder: '#1a1a1a',
  placeholder: '#3a3a3a',
  overlay: 'rgba(0, 0, 0, 0.85)',
  cardBorder: '#1a1a1a',
  tabBarBackground: '#050505',
  tabBarBorder: '#0f0f0f',
  shadowElevation1: 'rgba(0, 0, 0, 0.1)',
  shadowElevation2: 'rgba(0, 0, 0, 0.2)',
  shadowElevation3: 'rgba(0, 0, 0, 0.3)',
  shadowColor: '#000000',
  borderRadiusBase: 4,
  borderRadiusLg: 6,
  borderRadiusXl: 8,
  saturation: 0,
  warmth: 20,
};

// Level 2: Dégel Début
const LEVEL_2_DEGEL_DEBUT: Palette = {
  name: 'Dégel Début',
  description: 'Early thaw, warming begins',
  bgPrimary: '#0a0805',
  bgSecondary: '#12100c',
  surface: '#12100c',
  surfaceRaised: '#1a1814',
  surfaceAlt: '#14120f',
  text: '#999090',
  textMuted: '#888080',
  textSubtle: '#3a3530',
  tint: '#6a5a4a',
  tintSoft: '#8a7a6a',
  success: '#5a9a5a',
  successSoft: '#4a7a4a',
  warning: '#a67a3a',
  danger: '#9a4a4a',
  dangerSoft: '#7a3a3a',
  icon: '#6a6560',
  border: '#2a2620',
  borderStrong: '#1a1814',
  borderSoft: '#3a3530',
  inputBackground: '#1a1814',
  inputBorder: '#2a2620',
  placeholder: '#4a4540',
  overlay: 'rgba(0, 0, 0, 0.80)',
  cardBorder: '#2a2620',
  tabBarBackground: '#0f0d0a',
  tabBarBorder: '#1a1814',
  shadowElevation1: 'rgba(100, 80, 60, 0.08)',
  shadowElevation2: 'rgba(100, 80, 60, 0.12)',
  shadowElevation3: 'rgba(100, 80, 60, 0.18)',
  shadowColor: '#3a3530',
  borderRadiusBase: 6,
  borderRadiusLg: 8,
  borderRadiusXl: 10,
  saturation: 15,
  warmth: 35,
};

// Level 3: Dégel Moyen
const LEVEL_3_DEGEL_MOYEN: Palette = {
  name: 'Dégel Moyen',
  description: 'Moderate thaw, color emerges',
  bgPrimary: '#0f0d0a',
  bgSecondary: '#1a1814',
  surface: '#1a1814',
  surfaceRaised: '#22201a',
  surfaceAlt: '#1c1a16',
  text: '#aaaaaa',
  textMuted: '#999999',
  textSubtle: '#605247',
  tint: '#8f7153',
  tintSoft: '#9a8a7a',
  success: '#6aaa6a',
  successSoft: '#5a8a5a',
  warning: '#b68a4a',
  danger: '#aa5a5a',
  dangerSoft: '#8a4a4a',
  icon: '#7a7068',
  border: '#3a3228',
  borderStrong: '#2a2218',
  borderSoft: '#4a4238',
  inputBackground: '#8f7153',
  inputBorder: '#3a3228',
  placeholder: '#6e6054',
  overlay: 'rgba(0, 0, 0, 0.75)',
  cardBorder: '#3a3228',
  tabBarBackground: '#131109',
  tabBarBorder: '#1f1d1a',
  shadowElevation1: 'rgba(120, 100, 80, 0.10)',
  shadowElevation2: 'rgba(120, 100, 80, 0.16)',
  shadowElevation3: 'rgba(120, 100, 80, 0.24)',
  shadowColor: '#4a4238',
  borderRadiusBase: 8,
  borderRadiusLg: 10,
  borderRadiusXl: 12,
  saturation: 30,
  warmth: 50,
};

// Level 4: Dégel Avancé
const LEVEL_4_DEGEL_AVANCE: Palette = {
  name: 'Dégel Avancé',
  description: 'Advanced thaw, warmth emerging',
  bgPrimary: '#14120e',
  bgSecondary: '#1f1d19',
  surface: '#1f1d19',
  surfaceRaised: '#27251f',
  surfaceAlt: '#212018',
  text: '#b8b8a0',
  textMuted: '#aaaaaa',
  textSubtle: '#5a5045',
  tint: '#7a8070',
  tintSoft: '#9aaa9a',
  success: '#7aba7a',
  successSoft: '#6a9a6a',
  warning: '#c69a5a',
  danger: '#ba6a6a',
  dangerSoft: '#9a5a5a',
  icon: '#8a8078',
  border: '#4a4230',
  borderStrong: '#3a3220',
  borderSoft: '#5a5240',
  inputBackground: '#27251f',
  inputBorder: '#4a4230',
  placeholder: '#6a6050',
  overlay: 'rgba(0, 0, 0, 0.70)',
  cardBorder: '#4a4230',
  tabBarBackground: '#17150f',
  tabBarBorder: '#242218',
  shadowElevation1: 'rgba(140, 120, 100, 0.12)',
  shadowElevation2: 'rgba(140, 120, 100, 0.18)',
  shadowElevation3: 'rgba(140, 120, 100, 0.28)',
  shadowColor: '#5a5240',
  borderRadiusBase: 10,
  borderRadiusLg: 12,
  borderRadiusXl: 14,
  saturation: 45,
  warmth: 65,
};

// Level 5: Organique Naturel
const LEVEL_5_ORGANIQUE_NATUREL: Palette = {
  name: 'Organique Naturel',
  description: 'Connected to nature, earthy, alive',
  bgPrimary: '#19170f',
  bgSecondary: '#242218',
  surface: '#242218',
  surfaceRaised: '#2e2c24',
  surfaceAlt: '#26241c',
  text: '#aaa096',
  textMuted: '#8a8070',
  textSubtle: '#6a6050',
  tint: '#7bc497',
  tintSoft: '#8ab8a0',
  success: '#5a9070',
  successSoft: '#4a7a60',
  warning: '#d6aa6a',
  danger: '#ca7a7a',
  dangerSoft: '#aa6a6a',
  icon: '#9a9085',
  border: '#5a5240',
  borderStrong: '#4a4230',
  borderSoft: '#6a6250',
  inputBackground: '#2e2c24',
  inputBorder: '#5a5240',
  placeholder: '#7a7060',
  overlay: 'rgba(0, 0, 0, 0.65)',
  cardBorder: '#5a5240',
  tabBarBackground: '#1b1914',
  tabBarBorder: '#2a2820',
  shadowElevation1: 'rgba(160, 140, 120, 0.14)',
  shadowElevation2: 'rgba(160, 140, 120, 0.20)',
  shadowElevation3: 'rgba(160, 140, 120, 0.32)',
  shadowColor: '#6a6250',
  borderRadiusBase: 12,
  borderRadiusLg: 14,
  borderRadiusXl: 16,
  saturation: 60,
  warmth: 75,
};

// Level 6: Organique Épanouissement
const LEVEL_6_ORGANIQUE_EPANOUISSEMENT: Palette = {
  name: 'Organique Épanouissement',
  description: 'Natural blooming, deeper connection',
  bgPrimary: '#1f1d15',
  bgSecondary: '#2e2c22',
  surface: '#2e2c22',
  surfaceRaised: '#38362c',
  surfaceAlt: '#30302a',
  text: '#b8ae9e',
  textMuted: '#9a9080',
  textSubtle: '#7a7060',
  tint: '#7ba880',
  tintSoft: '#9ac8b0',
  success: '#6a9e80',
  successSoft: '#5a8a70',
  warning: '#deb878',
  danger: '#d88888',
  dangerSoft: '#b87878',
  icon: '#aaa096',
  border: '#6a6248',
  borderStrong: '#5a5240',
  borderSoft: '#7a7258',
  inputBackground: '#38362c',
  inputBorder: '#6a6248',
  placeholder: '#8a8068',
  overlay: 'rgba(0, 0, 0, 0.60)',
  cardBorder: '#6a6248',
  tabBarBackground: '#21201a',
  tabBarBorder: '#32302a',
  shadowElevation1: 'rgba(170, 150, 130, 0.16)',
  shadowElevation2: 'rgba(170, 150, 130, 0.24)',
  shadowElevation3: 'rgba(170, 150, 130, 0.36)',
  shadowColor: '#7a7258',
  borderRadiusBase: 14,
  borderRadiusLg: 16,
  borderRadiusXl: 18,
  saturation: 70,
  warmth: 85,
};

// Level 7: Épanouissement Énergie
const LEVEL_7_EPANOUISSEMENT_ENERGIE: Palette = {
  name: 'Épanouissement Énergie',
  description: 'Expansive blooming, energetic',
  bgPrimary: '#242218',
  bgSecondary: '#34322a',
  surface: '#34322a',
  surfaceRaised: '#3e3c34',
  surfaceAlt: '#36342c',
  text: '#c4baa8',
  textMuted: '#a8a096',
  textSubtle: '#8a8070',
  tint: '#2ec573',
  tintSoft: '#5fdd9b',
  success: '#7aae90',
  successSoft: '#6a9a80',
  warning: '#f5a840',
  danger: '#ea9898',
  dangerSoft: '#ca8888',
  icon: '#b8ae9e',
  border: '#7a7250',
  borderStrong: '#6a6248',
  borderSoft: '#8a8260',
  inputBackground: '#3e3c34',
  inputBorder: '#7a7250',
  placeholder: '#9a9078',
  overlay: 'rgba(0, 0, 0, 0.55)',
  cardBorder: '#7a7250',
  tabBarBackground: '#282620',
  tabBarBorder: '#3a3832',
  shadowElevation1: 'rgba(180, 160, 140, 0.18)',
  shadowElevation2: 'rgba(180, 160, 140, 0.26)',
  shadowElevation3: 'rgba(180, 160, 140, 0.40)',
  shadowColor: '#8a8260',
  borderRadiusBase: 16,
  borderRadiusLg: 18,
  borderRadiusXl: 20,
  saturation: 80,
  warmth: 90,
};

// Level 8: Épanouissement Plein
const LEVEL_8_EPANOUISSEMENT_PLEIN: Palette = {
  name: 'Épanouissement Plein',
  description: 'Full bloom, vibrant growth',
  bgPrimary: '#2a281f',
  bgSecondary: '#3a3830',
  surface: '#3a3830',
  surfaceRaised: '#44423a',
  surfaceAlt: '#3c3a32',
  text: '#d0c6b4',
  textMuted: '#b4aa98',
  textSubtle: '#96a080',
  tint: '#42b87f',
  tintSoft: '#6feda8',
  success: '#88ba9e',
  successSoft: '#78aa8e',
  warning: '#fbb84d',
  danger: '#f0a4a4',
  dangerSoft: '#d09494',
  icon: '#c4baa8',
  border: '#8a8258',
  borderStrong: '#7a7250',
  borderSoft: '#9a9268',
  inputBackground: '#44423a',
  inputBorder: '#8a8258',
  placeholder: '#aaa68f',
  overlay: 'rgba(0, 0, 0, 0.50)',
  cardBorder: '#8a8258',
  tabBarBackground: '#2f2d24',
  tabBarBorder: '#3f3d35',
  shadowElevation1: 'rgba(190, 170, 150, 0.20)',
  shadowElevation2: 'rgba(190, 170, 150, 0.28)',
  shadowElevation3: 'rgba(190, 170, 150, 0.42)',
  shadowColor: '#9a9268',
  borderRadiusBase: 18,
  borderRadiusLg: 20,
  borderRadiusXl: 22,
  saturation: 85,
  warmth: 95,
};

// Level 9: Mystique Émergence
const LEVEL_9_MYSTIQUE_EMERGENCE: Palette = {
  name: 'Mystique Émergence',
  description: 'Transcendent awakening, luminescent',
  bgPrimary: '#0f0715',
  bgSecondary: '#1a1025',
  surface: '#1a1025',
  surfaceRaised: '#24182f',
  surfaceAlt: '#1c1227',
  text: '#d8cce0',
  textMuted: '#b8acc8',
  textSubtle: '#a095b0',
  tint: '#7c3aed',
  tintSoft: '#c8a2ff',
  success: '#6fb8a0',
  successSoft: '#4fa890',
  warning: '#fdd76a',
  danger: '#f8b0b0',
  dangerSoft: '#e8a0a0',
  icon: '#d0c4d8',
  border: '#2d1f3a',
  borderStrong: '#1a1025',
  borderSoft: '#3a2a45',
  inputBackground: '#24182f',
  inputBorder: '#2d1f3a',
  placeholder: '#a395ac',
  overlay: 'rgba(20, 10, 40, 0.70)',
  cardBorder: '#2d1f3a',
  tabBarBackground: '#13091a',
  tabBarBorder: '#211630',
  shadowElevation1: 'rgba(124, 58, 237, 0.15)',
  shadowElevation2: 'rgba(124, 58, 237, 0.25)',
  shadowElevation3: 'rgba(124, 58, 237, 0.40)',
  shadowColor: '#7c3aed',
  borderRadiusBase: 20,
  borderRadiusLg: 22,
  borderRadiusXl: 24,
  saturation: 92,
  warmth: 60,
};

// Level 10: Mystique Divin
const LEVEL_10_MYSTIQUE_DIVIN: Palette = {
  name: 'Mystique Divin',
  description: 'Divine transcendence, magical luminescence',
  bgPrimary: '#0a0415',
  bgSecondary: '#16082a',
  surface: '#16082a',
  surfaceRaised: '#22103d',
  surfaceAlt: '#1a0e32',
  text: '#e0d9ff',
  textMuted: '#c8c0e8',
  textSubtle: '#a8a0c8',
  tint: '#00ff88',
  tintSoft: '#7fffd4',
  success: '#5fcd9e',
  successSoft: '#3fbd8e',
  warning: '#ffe066',
  danger: '#ffb8b8',
  dangerSoft: '#f8a8a8',
  icon: '#d8d0e8',
  border: '#3d2a50',
  borderStrong: '#16082a',
  borderSoft: '#4a3a55',
  inputBackground: '#22103d',
  inputBorder: '#3d2a50',
  placeholder: '#b0a8c8',
  overlay: 'rgba(10, 4, 21, 0.75)',
  cardBorder: '#3d2a50',
  tabBarBackground: '#0f0920',
  tabBarBorder: '#251840',
  shadowElevation1: 'rgba(124, 58, 237, 0.15), rgba(0, 255, 136, 0.08)',
  shadowElevation2: 'rgba(124, 58, 237, 0.25), rgba(0, 255, 136, 0.12)',
  shadowElevation3: 'rgba(124, 58, 237, 0.40), rgba(0, 255, 136, 0.15)',
  shadowColor: 'rgba(124, 58, 237, 0.3)',
  borderRadiusBase: 24,
  borderRadiusLg: 26,
  borderRadiusXl: 28,
  saturation: 100,
  warmth: 100,
};

// Export palette map
export const PALETTES: PaletteMap = {
  1: LEVEL_1_OMBRE_FERMEE,
  2: LEVEL_2_DEGEL_DEBUT,
  3: LEVEL_3_DEGEL_MOYEN,
  4: LEVEL_4_DEGEL_AVANCE,
  5: LEVEL_5_ORGANIQUE_NATUREL,
  6: LEVEL_6_ORGANIQUE_EPANOUISSEMENT,
  7: LEVEL_7_EPANOUISSEMENT_ENERGIE,
  8: LEVEL_8_EPANOUISSEMENT_PLEIN,
  9: LEVEL_9_MYSTIQUE_EMERGENCE,
  10: LEVEL_10_MYSTIQUE_DIVIN,
};

export function getPaletteForLevel(level: WolfLevel): Palette {
  return PALETTES[level];
}

// Bridges the wolf-level evolutionary palette to the app-wide ThemeColors shape,
// so every screen (not just Profile) renders from the same palette source.
export function toThemeColors(palette: Palette): ThemeColors {
  return {
    text: palette.text,
    textMuted: palette.textMuted,
    textSubtle: palette.textSubtle,
    background: palette.bgPrimary,
    surface: palette.surface,
    surfaceRaised: palette.surfaceRaised,
    surfaceMuted: palette.surfaceAlt,
    surfaceAlt: palette.surfaceAlt,
    tint: palette.tint,
    tintSoft: palette.tintSoft,
    icon: palette.icon,
    tabIconDefault: palette.icon,
    tabIconSelected: palette.tint,
    border: palette.border,
    borderStrong: palette.borderStrong,
    borderSoft: palette.borderSoft,
    inputBackground: palette.inputBackground,
    inputBorder: palette.inputBorder,
    placeholder: palette.placeholder,
    overlay: palette.overlay,
    shadow: palette.shadowColor,
    cardBorder: palette.cardBorder,
    onPrimary: '#ffffff',
    success: palette.success,
    successSoft: palette.successSoft,
    warning: palette.warning,
    danger: palette.danger,
    dangerSoft: palette.dangerSoft,
    chartGrid: palette.borderSoft,
    chartAxis: palette.border,
    chartMuted: palette.textSubtle,
    tabBarBackground: palette.tabBarBackground,
    tabBarBorder: palette.tabBarBorder,
    loginBackground: palette.bgPrimary,
    loginText: palette.text,
    loginHint: palette.textMuted,
    loginButtonBackground: palette.tint,
  };
}
