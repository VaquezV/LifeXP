import { useMemo } from 'react';
import { createThemeStyles } from '@/constants/styles';
import { toThemeColors } from '@/lib/theme-evolution';
import { useThemeContext } from '@/lib/theme-context';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';

export function useAppTheme() {
  const { mode } = useThemeContext();
  const palette = useWolfLevelTheme();
  const colors = useMemo(() => toThemeColors(palette), [palette]);
  const styles = useMemo(() => createThemeStyles(colors), [colors]);

  return {
    mode,
    isDark: mode === 'dark',
    colors,
    styles,
  };
}
