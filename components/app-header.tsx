import { StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from './themed-text';

export interface AppHeaderProps {
  weeklyScore: number;
}

export function AppHeader({ weeklyScore }: AppHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
          borderBottomColor: isDark ? '#222222' : '#eeeeee',
        },
      ]}
    >
      <View style={styles.content}>
        <View>
          <ThemedText
            style={[
              styles.title,
              { color: isDark ? '#ffffff' : '#000000' },
            ]}
          >
            Life XP
          </ThemedText>
          <ThemedText
            style={[
              styles.subtitle,
              { color: isDark ? '#999999' : '#666666' },
            ]}
          >
            Weekly Progress
          </ThemedText>
        </View>
        <View style={styles.scoreBox}>
          <ThemedText
            style={[
              styles.scoreValue,
              { color: weeklyScore >= 75 ? '#4caf50' : weeklyScore >= 50 ? '#ff9800' : '#f44336' },
            ]}
          >
            {weeklyScore}%
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreBox: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
});
