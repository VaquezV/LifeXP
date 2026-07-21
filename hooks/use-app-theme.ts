import { useMemo } from 'react';
import { createThemeStyles } from '@/constants/styles';
import { toThemeColors } from '@/lib/theme-evolution';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';

export function useAppTheme() {
  const palette = useWolfLevelTheme();
  const colors = useMemo(() => toThemeColors(palette), [palette]);
  const styles = useMemo(() => createThemeStyles(colors), [colors]);

  return {
    colors,
    styles,
  };
}
