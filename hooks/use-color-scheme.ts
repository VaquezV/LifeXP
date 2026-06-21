import { useThemeContext } from '@/lib/theme-context';

export function useColorScheme(): 'light' | 'dark' | null {
  const { mode } = useThemeContext();
  return mode;
}
