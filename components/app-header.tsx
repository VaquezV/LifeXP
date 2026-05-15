import { StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { ThemedText } from './themed-text';

export interface AppHeaderProps {
  weeklyScore?: number;
}

export function AppHeader({ weeklyScore }: AppHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

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
        <ThemedText
          style={[
            styles.title,
            { color: isDark ? '#ffffff' : '#000000' },
          ]}
        >
          {t('lifeXP')}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 32,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
  },
});
