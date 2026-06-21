import { StyleSheet } from 'react-native';
import { ThemeColors } from './theme';

export function createThemeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    surface: {
      backgroundColor: colors.surface,
    },
    surfaceRaised: {
      backgroundColor: colors.surfaceRaised,
    },
    surfaceMuted: {
      backgroundColor: colors.surfaceMuted,
    },
    surfaceAlt: {
      backgroundColor: colors.surfaceAlt,
    },
    card: {
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    modalSheet: {
      backgroundColor: colors.surfaceRaised,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    modalOverlay: {
      backgroundColor: colors.overlay,
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderStrong,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    titleLarge: {
      color: colors.text,
      fontSize: 36,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    label: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    body: {
      color: colors.text,
      fontSize: 14,
    },
    bodyMuted: {
      color: colors.textMuted,
      fontSize: 14,
    },
    bodySubtle: {
      color: colors.textSubtle,
      fontSize: 14,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      borderColor: colors.inputBorder,
    },
    inputLarge: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    inputEmoji: {
      fontSize: 24,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
    },
    rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryButton: {
      backgroundColor: colors.tint,
    },
    secondaryButton: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dangerButton: {
      backgroundColor: colors.dangerSoft,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    buttonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    buttonTextOnPrimary: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    buttonTextMuted: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    chip: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    chipText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    chipTextActive: {
      color: colors.onPrimary,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    dividerBottom: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderStrong,
    },
    dividerTop: {
      borderTopWidth: 1,
      borderTopColor: colors.borderStrong,
    },
    mutedIcon: {
      color: colors.textSubtle,
    },
    placeholder: {
      color: colors.placeholder,
    },
    accentText: {
      color: colors.tint,
    },
  });
}
