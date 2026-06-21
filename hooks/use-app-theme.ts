import { useMemo } from 'react';
import { Colors, DEFAULT_THEME, type ThemeMode } from '@/constants/theme';
import { createThemeStyles } from '@/constants/styles';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppTheme() {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === 'light' ? 'light' : DEFAULT_THEME;
  const colors = Colors[mode];

  const styles = useMemo(() => createThemeStyles(colors), [mode, colors]);

  return {
    mode,
    isDark: mode === 'dark',
    colors,
    styles,
  };
}
