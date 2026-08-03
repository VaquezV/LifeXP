import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

interface WolfEvolutionModalProps {
  visible: boolean;
  nextClass: string;
  nextAvatarScore: number;
  requirements: string[];
  onClose: () => void;
}

/** Preview of the next wolf form and the category levels required to reach it. */
export function WolfEvolutionModal({
  visible,
  nextClass,
  nextAvatarScore,
  requirements,
  onClose,
}: WolfEvolutionModalProps) {
  const theme = useWolfLevelTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modal, { backgroundColor: theme.surfaceRaised, borderColor: theme.tint }]}
          onPress={() => {}}
          accessibilityViewIsModal
        >
          <View style={styles.topRow}>
            <ThemedText style={[styles.eyebrow, { color: theme.tint }]}>PROCHAINE ÉTAPE</ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer la prochaine étape"
              hitSlop={10}
            >
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.avatarPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <Avatar score={nextAvatarScore} size="medium" accentColor={theme.tint} />
              <View style={styles.avatarCopy}>
                <ThemedText style={[styles.evolutionName, { color: theme.text }]}>{nextClass}</ThemedText>
                <ThemedText style={[styles.explanation, { color: theme.textMuted }]}>
                  Voici la prochaine forme de ton loup.
                </ThemedText>
              </View>
            </View>

            <View style={styles.requirements}>
              <ThemedText style={[styles.requirementsTitle, { color: theme.text }]}>CONDITIONS À REMPLIR</ThemedText>
              {requirements.map(requirement => (
                <View key={requirement} style={[styles.requirement, { borderColor: theme.borderSoft }]}>
                  <MaterialIcons name="lock-outline" size={20} color={theme.tint} />
                  <ThemedText style={[styles.requirementLabel, { color: theme.text }]}>
                    Atteindre {requirement.replace(/niv(\d+)/i, 'Niv. $1')}
                  </ThemedText>
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
  avatarPanel: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12 },
  avatarCopy: { flex: 1, gap: 5 },
  evolutionName: { fontSize: 20, lineHeight: 25, fontWeight: '800' },
  explanation: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  requirements: { gap: 9 },
  requirementsTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  requirement: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, paddingTop: 9 },
  requirementLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
});
