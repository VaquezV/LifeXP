import { StyleSheet, View, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from '@/hooks/use-translation';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useThemeContext } from '@/lib/theme-context';
import { ThemedText } from './themed-text';

export interface AppHeaderProps {
  weeklyScore?: number;
}

export function AppHeader({ weeklyScore }: AppHeaderProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const { t } = useTranslation();
  const { mode, toggleTheme } = useThemeContext();

  return (
    <View
      style={[
        styles.container,
        themeStyles.surface,
        themeStyles.dividerBottom,
      ]}
    >
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {t('lifeXP')}
        </ThemedText>
        <TouchableOpacity onPress={toggleTheme} style={styles.toggleButton} hitSlop={8}>
          <MaterialIcons
            name={mode === 'dark' ? 'wb-sunny' : 'brightness-3'}
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
  },
  toggleButton: {
    padding: 4,
  },
});
