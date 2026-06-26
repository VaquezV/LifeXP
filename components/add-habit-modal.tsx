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
import { PresetHabit, CategoryType, FrequencyType, CATEGORY_KEYS } from '@/lib/types';
import { CATEGORY_TRANSLATION_KEY } from '@/lib/translations';
import { useTranslation } from '@/hooks/use-translation';
import { CATEGORY_COLORS } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '@/hooks/use-app-theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (habit: {
    name: string;
    emoji: string;
    category: CategoryType;
    frequency_type: FrequencyType;
    target_value: number;
    min_value: number;
    preset_habit_id: string | null;
  }) => Promise<void>;
  presets: PresetHabit[];
  defaultCategory?: CategoryType;
}

type Step = 'picker' | 'level' | 'form';


const FREQ_LABELS: Record<string, string> = {
  per_day: 'Durée/jour',
  times_per_day: 'Fois/jour',
  times_per_week: 'Fois/sem.',
};

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


function formatTarget(preset: PresetHabit): string {
  const v = preset.target_value;
  if (preset.frequency_type === 'per_day') {
    if (v >= 1000) return `${v.toLocaleString('fr-FR')} pas`;
    if (v >= 60) {
      const h = Math.floor(v / 60);
      const m = v % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${v} min`;
  }
  if (preset.frequency_type === 'times_per_day') return v === 1 ? '1x/jour' : `${v}x/jour`;
  if (preset.frequency_type === 'times_per_week') return `${v}x/sem.`;
  return String(v);
}

const INITIAL_FORM: {
  name: string;
  emoji: string;
  category: CategoryType;
  frequency_type: FrequencyType;
  target_value: number;
  min_value: number;
} = {
  name: '',
  emoji: '⭐',
  category: 'self_care',
  frequency_type: 'per_day',
  target_value: 60,
  min_value: 30,
};

export function AddHabitModal({ visible, onClose, onSave, presets, defaultCategory }: Props) {
  const { colors, styles: themeStyles } = useAppTheme();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('picker');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetHabit | null>(null);
  const [form, setForm] = useState({ ...INITIAL_FORM, category: defaultCategory ?? 'self_care' as CategoryType });

  const resetAndClose = () => {
    setStep('picker');
    setSelectedName(null);
    setSelectedPreset(null);
    setForm({ ...INITIAL_FORM, category: defaultCategory ?? 'self_care' });
    onClose();
  };

  const namesByCategory = Object.fromEntries(
    CATEGORY_KEYS.map(cat => [
      cat,
      [...new Set(presets.filter(p => p.category === cat).map(p => p.name))].sort(),
    ])
  );
  const variants = presets.filter(p => p.name === selectedName);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={[styles.overlay, themeStyles.modalOverlay]}>
        <View
          style={[
            styles.container,
            themeStyles.modalSheet,
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Nouvelle habitude
            </Text>
            <Pressable style={styles.closeButton} onPress={resetAndClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </Pressable>
          </View>

          {step === 'picker' && (
            <ScrollView style={styles.content}>
              {(defaultCategory ? [defaultCategory] : CATEGORY_KEYS).map(cat => {
                const names = namesByCategory[cat];
                if (!names || names.length === 0) return null;
                return (
                  <View key={cat}>
                    <View style={[styles.categoryHeader, { borderLeftColor: CATEGORY_COLORS[cat].mid }]}>
                      <Text style={[styles.categoryHeaderText, { color: CATEGORY_COLORS[cat].mid }]}>
                        {t(CATEGORY_TRANSLATION_KEY[cat])}
                      </Text>
                    </View>
                    {names.map(name => (
                      <Pressable
                        key={name}
                        style={[styles.presetRow, { borderBottomColor: colors.borderStrong }]}
                        onPress={() => {
                          setSelectedName(name);
                          setStep('level');
                        }}
                      >
                        <Text style={[styles.presetRowText, { color: colors.text }]}>{name}</Text>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textSubtle} />
                      </Pressable>
                    ))}
                  </View>
                );
              })}

              <Pressable
                style={[styles.manualButton, { borderColor: colors.borderSoft }]}
                onPress={() => setStep('form')}
              >
                <Text style={[styles.manualButtonText, { color: colors.textMuted }]}>
                  + Créer manuellement
                </Text>
              </Pressable>
            </ScrollView>
          )}

          {step === 'level' && (
            <View style={styles.content}>
              <Text style={[styles.levelTitle, { color: colors.textMuted }]}>
                {selectedName}
              </Text>
              <View style={styles.levelGrid}>
                {variants.map(variant => (
                  <Pressable
                    key={variant.id}
                    style={[styles.levelChip, themeStyles.surfaceMuted]}
                    onPress={() => {
                      setSelectedPreset(variant);
                      const expertiseLabel = EXPERTISE_LABELS[variant.expertise] ?? variant.expertise;
                      setForm({
                        name: `${variant.name} - ${expertiseLabel}`,
                        emoji: variant.emoji || '⭐',
                        category: variant.category,
                        frequency_type: variant.frequency_type,
                        target_value: variant.target_value,
                        min_value: variant.min_value,
                      });
                      setStep('form');
                    }}
                  >
                    <Text style={[styles.levelChipText, { color: colors.text }]}>
                      {EXPERTISE_LABELS[variant.expertise] ?? variant.expertise}
                    </Text>
                    <Text style={[styles.levelChipSub, { color: colors.textMuted }]}>
                      {formatTarget(variant)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.backButton} onPress={() => setStep('picker')}>
                <MaterialIcons name="arrow-back" size={18} color={colors.textMuted} />
                <Text style={[styles.backButtonText, { color: colors.textMuted }]}>Retour</Text>
              </Pressable>
            </View>
          )}

          {step === 'form' && (
            <ScrollView style={styles.content}>
              {/* Emoji */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Emoji</Text>
                <TextInput
                  style={[styles.emojiInput, themeStyles.input, themeStyles.inputEmoji]}
                  value={form.emoji}
                  onChangeText={t => setForm(f => ({ ...f, emoji: t }))}
                  maxLength={2}
                />
              </View>

              {/* Nom */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Nom</Text>
                <TextInput
                  style={[styles.textInput, themeStyles.input]}
                  value={form.name}
                  onChangeText={t => setForm(f => ({ ...f, name: t }))}
                  editable={!selectedPreset}
                />
              </View>

              {/* Catégorie */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Catégorie</Text>
                <View style={styles.chipRow}>
                  {CATEGORY_KEYS.map(cat => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.chip,
                        form.category === cat
                          ? { backgroundColor: CATEGORY_COLORS[cat].mid }
                          : { borderWidth: 1, borderColor: colors.borderSoft },
                      ]}
                      onPress={() => !selectedPreset && setForm(f => ({ ...f, category: cat }))}
                    >
                      <Text style={[styles.chipText, { color: form.category === cat ? colors.onPrimary : colors.textMuted }]}>
                        {t(CATEGORY_TRANSLATION_KEY[cat])}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Fréquence */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Fréquence</Text>
                <View style={styles.chipRow}>
                  {(Object.keys(FREQ_LABELS) as FrequencyType[]).map(freq => {
                    const locked = selectedPreset && !selectedPreset.editable_frequency_type;
                    return (
                      <Pressable
                        key={freq}
                        style={[
                          styles.chip,
                          form.frequency_type === freq
                            ? { backgroundColor: colors.tint }
                            : { borderWidth: 1, borderColor: colors.borderSoft },
                          locked ? { opacity: 0.5 } : {},
                        ]}
                        onPress={() => !locked && setForm(f => ({ ...f, frequency_type: freq }))}
                      >
                        <Text style={[styles.chipText, { color: form.frequency_type === freq ? colors.onPrimary : colors.textMuted }]}>
                          {FREQ_LABELS[freq]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Target value */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Objectif</Text>
                <TextInput
                  style={[styles.textInput, themeStyles.input, { opacity: (selectedPreset && !selectedPreset.editable_target_value) ? 0.5 : 1 }]}
                  value={String(form.target_value)}
                  onChangeText={t => setForm(f => ({ ...f, target_value: parseInt(t) || 0 }))}
                  keyboardType="number-pad"
                  editable={!selectedPreset || selectedPreset.editable_target_value}
                />
              </View>

              {/* Min value — seulement si per_day */}
              {form.frequency_type === 'per_day' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>Minimum</Text>
                  <TextInput
                    style={[styles.textInput, themeStyles.input, { opacity: (selectedPreset && !selectedPreset.editable_min_value) ? 0.5 : 1 }]}
                    value={String(form.min_value)}
                    onChangeText={t => setForm(f => ({ ...f, min_value: parseInt(t) || 0 }))}
                    keyboardType="number-pad"
                    editable={!selectedPreset || selectedPreset.editable_min_value}
                  />
                </View>
              )}

              {/* Boutons */}
              <View style={[styles.actions, themeStyles.dividerTop]}>
                <Pressable
                  style={[styles.btnSecondary, themeStyles.secondaryButton]}
                  onPress={() => selectedPreset ? setStep('level') : setStep('picker')}
                >
                  <Text style={[styles.btnText, { color: colors.textMuted }]}>Retour</Text>
                </Pressable>
                <Pressable
                  style={[styles.btnPrimary, themeStyles.primaryButton]}
                  onPress={async () => {
                    if (!form.name.trim()) return;
                    try {
                      await onSave({ ...form, preset_habit_id: selectedPreset?.id ?? null });
                      resetAndClose();
                    } catch (e) {
                      console.error('Erreur lors de la sauvegarde :', e);
                    }
                  }}
                >
                  <Text style={[styles.btnText, { color: colors.onPrimary }]}>Sauvegarder</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  emojiInput: {
    width: 60,
  },
  textInput: {
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, alignItems: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row', gap: 12,
    marginTop: 8, marginBottom: 24,
  },
  btnSecondary: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', borderWidth: 1,
  },
  btnPrimary: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { fontSize: 14, fontWeight: '600' },
  categoryHeader:     { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 8, marginTop: 12, marginBottom: 4 },
  categoryHeaderText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
