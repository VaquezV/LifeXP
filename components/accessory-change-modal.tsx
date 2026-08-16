// components/accessory-change-modal.tsx
import React, { useMemo } from 'react';
import { Modal, View, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { ProgressionElementIcon } from './profile-redesign/ProgressionElementIcon';
import { ACCESSORY_LABELS } from '@/lib/category-elements-config';
import { ACCESSORY_GAINED_QUOTES, ACCESSORY_LOST_QUOTES, pickAccessoryQuote } from '@/lib/accessory-quotes';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AccessoryDiffItem } from '@/lib/accessory-diff';

interface AccessoryChangeModalProps {
  visible: boolean;
  direction: 'gained' | 'lost';
  items: AccessoryDiffItem[];
  onContinue: () => void;
}

/** Groups every accessory gained (or lost) across all categories since the user last saw this modal, with a motivational line. Shared by the gain and loss flows in app/_layout.tsx — same layout, different copy/quote pool/icon state. */
export function AccessoryChangeModal({ visible, direction, items, onContinue }: AccessoryChangeModalProps) {
  const { colors } = useAppTheme();
  const isGain = direction === 'gained';
  const accentColor = isGain ? colors.tint : colors.textMuted;
  const title = isGain ? 'Nouveaux accessoires' : 'Accessoires perdus';

  const quote = useMemo(
    () => pickAccessoryQuote(isGain ? ACCESSORY_GAINED_QUOTES : ACCESSORY_LOST_QUOTES),
    [isGain]
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.overlay }]}>
        <ThemedView style={styles.modal}>
          <ThemedText style={styles.title} type="title">
            {title}
          </ThemedText>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {items.map(({ category, element }) => (
              <View key={`${category}-${element.id}`} style={styles.row}>
                <View style={[styles.iconFrame, { borderColor: accentColor }]}>
                  <ProgressionElementIcon
                    element={element}
                    state={isGain ? 'unlocked' : 'locked'}
                    accentColor={accentColor}
                    mutedColor={colors.border}
                    size={40}
                  />
                </View>
                <View style={styles.rowText}>
                  <ThemedText style={styles.elementLabel}>{element.label}</ThemedText>
                  <ThemedText style={[styles.categoryLabel, { color: colors.textMuted }]}>
                    {ACCESSORY_LABELS[category]}
                  </ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>

          <ThemedText style={[styles.quote, { color: accentColor }]}>{quote}</ThemedText>

          <Pressable style={[styles.button, { backgroundColor: colors.tint }]} onPress={onContinue}>
            <ThemedText style={styles.buttonText}>Continuer</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    alignSelf: 'stretch',
    maxHeight: 260,
  },
  listContent: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconFrame: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  elementLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  quote: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
