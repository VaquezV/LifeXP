import { Platform } from 'react-native';

export type ThemeMode = 'dark' | 'light';

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

export const Colors: Record<ThemeMode, ThemeColors> = {
  dark: {
    text: '#ffffff',
    textMuted: '#aaaaaa',
    textSubtle: '#666666',
    background: '#000000',
    surface: '#020811',
    surfaceRaised: '#061121',
    surfaceMuted: '#061121',
    surfaceAlt: '#111111',
    tint: '#2a9d8f',
    tintSoft: '#e6f5ed',
    icon: '#9BA1A6',
    tabIconDefault: '#667085',
    tabIconSelected: '#f5f7fa',
    border: '#333333',
    borderStrong: '#222222',
    borderSoft: '#444444',
    inputBackground: '#2a2a2a',
    inputBorder: '#333333',
    placeholder: '#666666',
    overlay: 'rgba(0,0,0,0.7)',
    shadow: '#000000',
    cardBorder: '#1d262b',
    onPrimary: '#ffffff',
    success: '#2a9d8f',
    successSoft: '#1a2f24',
    warning: '#f59e0b',
    danger: '#f44336',
    dangerSoft: '#2a1515',
    chartGrid: '#222222',
    chartAxis: '#444444',
    chartMuted: '#666666',
    tabBarBackground: '#0b0f14',
    tabBarBorder: '#18202a',
    loginBackground: '#061121',
    loginText: '#e1e9fc',
    loginHint: '#9aa4b2',
    loginButtonBackground: '#e1e9fc',
  },
  light: {
    text: '#000000',
    textMuted: '#666666',
    textSubtle: '#999999',
    background: '#ffffff',
    surface: '#f5f5f5',
    surfaceRaised: '#ffffff',
    surfaceMuted: '#f0f0f0',
    surfaceAlt: '#fafafa',
    tint: '#2a9d8f',
    tintSoft: '#e6f5ed',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#2a9d8f',
    border: '#cccccc',
    borderStrong: '#eeeeee',
    borderSoft: '#dddddd',
    inputBackground: '#f5f5f5',
    inputBorder: '#dddddd',
    placeholder: '#999999',
    overlay: 'rgba(0,0,0,0.7)',
    shadow: '#000000',
    cardBorder: '#dce8e4',
    onPrimary: '#ffffff',
    success: '#2a9d8f',
    successSoft: '#e6f5ed',
    warning: '#f59e0b',
    danger: '#f44336',
    dangerSoft: '#ffebee',
    chartGrid: '#eeeeee',
    chartAxis: '#cccccc',
    chartMuted: '#aaaaaa',
    tabBarBackground: '#f8fafc',
    tabBarBorder: '#d9e1e8',
    loginBackground: '#061121',
    loginText: '#e1e9fc',
    loginHint: '#9aa4b2',
    loginButtonBackground: '#2a9d8f',
  },
};

export const DEFAULT_THEME: ThemeMode = 'dark';

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
    mid: '#ba68c8',
    dark: '#6a1b9a',
  },
  vie_familiale: {
    light: '#ffebee',
    mid: '#ef5350',
    dark: '#c62828',
  },
  vie_pro: {
    light: '#e3f2fd',
    mid: '#42a5f5',
    dark: '#1565c0',
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
