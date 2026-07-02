// lib/hooks/use-wolf-level-theme.ts

import { useMemo } from 'react';
import { useThemeContext } from '@/lib/theme-context';
import { getPaletteForLevel, type Palette } from '@/lib/theme-evolution';

export interface WolfTheme extends Palette {
  wolfLevel: number;
}

export function useWolfLevelTheme(): WolfTheme {
  const { wolfLevel } = useThemeContext();

  const theme = useMemo(() => {
    const palette = getPaletteForLevel(wolfLevel);
    return {
      ...palette,
      wolfLevel,
    };
  }, [wolfLevel]);

  return theme;
}
