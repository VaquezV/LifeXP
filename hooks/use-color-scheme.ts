import { useColorScheme as useSystemColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' | null {
  return 'dark'; // Force dark mode
}
