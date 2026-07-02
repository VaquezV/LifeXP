import { View, type ViewProps } from 'react-native';

import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';

export function ThemedView({ style, ...props }: ViewProps) {
  const theme = useWolfLevelTheme();

  return <View style={[{ backgroundColor: theme.surface }, style]} {...props} />;
}
