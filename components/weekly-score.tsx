import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemedText } from './themed-text';

export interface WeeklyScoreProps {
  percentage: number; // 0-100
}

export function WeeklyScore({ percentage }: WeeklyScoreProps) {
  const { colors } = useAppTheme();

  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>This week</ThemedText>
      <ThemedText
        type="defaultSemiBold"
        style={[styles.percentage, { color: colors.text }]}
      >
        {Math.round(clampedPercentage)}%
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  percentage: {
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 56,
  },
});
