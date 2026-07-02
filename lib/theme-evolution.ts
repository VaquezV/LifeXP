// lib/theme-evolution.ts

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
