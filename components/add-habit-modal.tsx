import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { PresetHabit, CategoryType } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (habit: {
    name: string;
    emoji: string;
    category: CategoryType;
    frequency_type: string;
    target_value: number;
    min_value: number;
    preset_habit_id: string | null;
  }) => Promise<void>;
  presets: PresetHabit[];
}

type Step = 'picker' | 'level' | 'form';

const EXPERTISE_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  expert: 'Expert',
  enfant: 'Enfant',
  ado: 'Ado',
  adulte_homme: 'Adulte (H)',
  adulte_femme: 'Adulte (F)',
  standard: 'Standard',
};

const INITIAL_FORM = {
  name: '',
  emoji: '⭐',
  category: 'self_care' as CategoryType,
  frequency_type: 'per_day',
  target_value: 60,
  min_value: 30,
};

export function AddHabitModal({ visible, onClose, onSave, presets }: Props) {
  const isDark = useColorScheme() === 'dark';

  const [step, setStep] = useState<Step>('picker');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetHabit | null>(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });

  const resetAndClose = () => {
    setStep('picker');
    setSelectedName(null);
    setSelectedPreset(null);
    setForm({ ...INITIAL_FORM });
    onClose();
  };

  const uniqueNames = [...new Set(presets.map(p => p.name))].sort();
  const variants = presets.filter(p => p.name === selectedName);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#ffffff' : '#000000' },
              ]}
            >
              Nouvelle habitude
            </Text>
            <Pressable style={styles.closeButton} onPress={resetAndClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#ffffff' : '#000000'}
              />
            </Pressable>
          </View>

          {step === 'picker' && (
            <ScrollView style={styles.content}>
              {uniqueNames.map(name => (
                <Pressable
                  key={name}
                  style={[styles.presetRow, { borderBottomColor: isDark ? '#222' : '#eee' }]}
                  onPress={() => {
                    setSelectedName(name);
                    setStep('level');
                  }}
                >
                  <Text style={[styles.presetRowText, { color: isDark ? '#fff' : '#000' }]}>
                    {name}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={isDark ? '#666' : '#999'} />
                </Pressable>
              ))}

              <Pressable
                style={[styles.manualButton, { borderColor: isDark ? '#444' : '#ccc' }]}
                onPress={() => setStep('form')}
              >
                <Text style={[styles.manualButtonText, { color: isDark ? '#aaa' : '#666' }]}>
                  + Créer manuellement
                </Text>
              </Pressable>
            </ScrollView>
          )}

          {step === 'level' && (
            <View style={styles.content}>
              <Text style={[styles.levelTitle, { color: isDark ? '#aaa' : '#666' }]}>
                {selectedName}
              </Text>
              <View style={styles.levelGrid}>
                {variants.map(variant => (
                  <Pressable
                    key={variant.id}
                    style={[styles.levelChip, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}
                    onPress={() => {
                      setSelectedPreset(variant);
                      setForm({
                        name: variant.name,
                        emoji: variant.emoji || '⭐',
                        category: variant.category,
                        frequency_type: variant.frequency_type,
                        target_value: variant.target_value,
                        min_value: variant.min_value,
                      });
                      setStep('form');
                    }}
                  >
                    <Text style={[styles.levelChipText, { color: isDark ? '#fff' : '#000' }]}>
                      {EXPERTISE_LABELS[variant.expertise] ?? variant.expertise}
                    </Text>
                    <Text style={[styles.levelChipSub, { color: isDark ? '#888' : '#999' }]}>
                      {variant.target_value} min
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.backButton} onPress={() => setStep('picker')}>
                <MaterialIcons name="arrow-back" size={18} color={isDark ? '#aaa' : '#666'} />
                <Text style={[styles.backButtonText, { color: isDark ? '#aaa' : '#666' }]}>Retour</Text>
              </Pressable>
            </View>
          )}

          {step === 'form' && null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: { padding: 16 },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  presetRowText: { fontSize: 16, fontWeight: '500' },
  manualButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  manualButtonText: { fontSize: 14, fontWeight: '600' },
  levelTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  levelChip: {
    borderRadius: 10,
    padding: 16,
    minWidth: '45%',
    alignItems: 'center',
  },
  levelChipText: { fontSize: 15, fontWeight: '600' },
  levelChipSub: { fontSize: 12, marginTop: 4 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 20,
    paddingVertical: 8,
  },
  backButtonText: { fontSize: 14 },
});
