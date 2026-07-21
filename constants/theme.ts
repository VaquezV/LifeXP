import { Platform } from 'react-native';

export type ThemeColors = {
  text: string;
  textMuted: string;
  textSubtle: string;
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  surfaceAlt: string;
  tint: string;
  tintSoft: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
  borderStrong: string;
  borderSoft: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  overlay: string;
  shadow: string;
  cardBorder: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  chartGrid: string;
  chartAxis: string;
  chartMuted: string;
  tabBarBackground: string;
  tabBarBorder: string;
  loginBackground: string;
  loginText: string;
  loginHint: string;
  loginButtonBackground: string;
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const CATEGORY_COLORS = {
  self_care: {
    light: '#e8f5e9',
    mid: '#81c784',
    dark: '#2e7d32',
  },
  dev_perso: {
    light: '#f3e5f5',
    mid: '#c8a668',
    dark: '#a29b30',
  },
  vie_familiale: {
    light: '#ffebee',
    mid: '#c74543',
    dark: '#912222',
  },
  vie_pro: {
    light: '#e3f2fd',
    mid: '#3d63d3',
    dark: '#14338f',
  },
} as const;

export const WEEK_SUMMARY_SCORE_STOPS = [
  { score: 0, light: '#fef2f2', dark: '#1a0f0f' },
  { score: 20, light: '#fce7e6', dark: '#2a1515' },
  { score: 40, light: '#f5e6f0', dark: '#251820' },
  { score: 60, light: '#e8f0f5', dark: '#1a2530' },
  { score: 80, light: '#e6f5ed', dark: '#1a2f24' },
  { score: 100, light: '#e6fff5', dark: '#0d2d1f' },
] as const;

export function getGradientColor(
  category: keyof typeof CATEGORY_COLORS,
  percentage: number
): string {
  const colors = CATEGORY_COLORS[category];
  const clamped = Math.max(0, Math.min(100, percentage));

  if (clamped <= 50) {
    const ratio = clamped / 50;
    return interpolateColor(colors.light, colors.mid, ratio);
  }

  const ratio = (clamped - 50) / 50;
  return interpolateColor(colors.mid, colors.dark, ratio);
}

function interpolateColor(color1: string, color2: string, ratio: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}
