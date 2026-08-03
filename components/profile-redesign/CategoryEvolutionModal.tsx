import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AccessoryIcon } from '@/components/accessory-icon';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ACCESSORY_LABELS, getAccessoryName } from '@/lib/category-elements-config';
import { getCategoryLevelElements } from '@/lib/category-elements';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { ensureContrast } from '@/lib/theme-evolution';
import type { CategoryType } from '@/lib/types';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ProgressionElementIcon } from './ProgressionElementIcon';

interface CategoryEvolutionModalProps {
  category: CategoryType;
  currentLevel: number;
  visible: boolean;
  onClose: () => void;
}

/** Detail view for the next category level. Everything is derived from the same
 * category level config as the Sanctuaire card, so it never creates inventory state. */
export function CategoryEvolutionModal({
  category,
  currentLevel,
  visible,
  onClose,
}: CategoryEvolutionModalProps) {
  const theme = useWolfLevelTheme();
  const accentColor = ensureContrast(CATEGORY_COLORS[category].mid, theme.surface, 4.5);
  const nextLevel = Math.min(currentLevel + 1, 5);
  const isMaxLevel = currentLevel >= 5;
  const elements = getCategoryLevelElements(category, nextLevel);
  const title = isMaxLevel ? 'Évolution accomplie' : `Prochaine évolution — Niv. ${nextLevel}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modal, { backgroundColor: theme.surfaceRaised, borderColor: accentColor }]}
          onPress={() => {}}
          accessibilityViewIsModal
        >
          <View style={styles.topRow}>
            <ThemedText style={[styles.eyebrow, { color: accentColor }]}>{title.toUpperCase()}</ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer l'évolution"
              hitSlop={10}
            >
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.avatarPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <AccessoryIcon category={category} level={nextLevel} size={118} />
              <View style={styles.avatarCopy}>
                <ThemedText style={[styles.categoryName, { color: accentColor }]}>
                  {ACCESSORY_LABELS[category].toUpperCase()}
                </ThemedText>
                <ThemedText style={[styles.evolutionName, { color: theme.text }]}>
                  {getAccessoryName(category, nextLevel)}
                </ThemedText>
                <ThemedText style={[styles.explanation, { color: theme.textMuted }]}>
                  {isMaxLevel
                    ? 'Cette catégorie a atteint son plein potentiel.'
                    : 'Voici les accessoires qui prendront vie au prochain niveau.'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.requirements}>
              <ThemedText style={[styles.requirementsTitle, { color: theme.text }]}>ACCESSOIRES À OBTENIR</ThemedText>
              {elements.map(element => (
                <View key={element.id} style={[styles.requirement, { borderColor: theme.borderSoft }]}> 
                  <View style={[styles.elementIcon, { borderColor: accentColor, backgroundColor: theme.surface }]}> 
                    <ProgressionElementIcon
                      element={element}
                      state="unlocked"
                      accentColor={accentColor}
                      mutedColor={theme.borderSoft}
                      size={44}
                    />
                  </View>
                  <ThemedText style={[styles.requirementLabel, { color: theme.text }]}>{element.label}</ThemedText>
                </View>
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.72)', justifyContent: 'center', padding: 20 },
  modal: { maxHeight: '80%', borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20, gap: 22 },
  avatarPanel: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14 },
  avatarCopy: { flex: 1, gap: 5 },
  categoryName: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  evolutionName: { fontSize: 20, lineHeight: 25, fontWeight: '800' },
  explanation: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  requirements: { gap: 9 },
  requirementsTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  requirement: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingTop: 10 },
  elementIcon: { width: 56, height: 56, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  requirementLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
});
