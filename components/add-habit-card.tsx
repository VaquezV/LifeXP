import { StyleSheet, View, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { CategoryType, CATEGORY_KEYS } from '@/lib/types';
import { CATEGORY_TRANSLATION_KEY } from '@/lib/translations';
import { useTranslation } from '@/hooks/use-translation';
import { useAppTheme } from '@/hooks/use-app-theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type FrequencyType = 'per_day' | 'times_per_day' | 'times_per_week';

export interface AddHabitCardProps {
  onAddHabit: (habit: {
    name: string;
    emoji: string;
    category: CategoryType;
    frequency_type: FrequencyType;
    target_value: number;
    min_value: number;
  }) => Promise<void>;
}

export function AddHabitCard({ onAddHabit }: AddHabitCardProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    emoji: '⭐',
    category: 'self_care' as CategoryType,
    frequency_type: 'per_day' as FrequencyType,
    target_value: 60,
    min_value: 30,
  });

  const handleAddHabit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    try {
      await onAddHabit(formData);
      setFormData({
        name: '',
        emoji: '⭐',
        category: 'self_care',
        frequency_type: 'per_day',
        target_value: 60,
        min_value: 30,
      });
      setShowModal(false);
    } catch (error) {
      alert('Error adding habit: ' + String(error));
    }
  };

  return (
    <>
      <Pressable
        style={[
          styles.addButton,
          themeStyles.surfaceRaised,
        ]}
        onPress={() => setShowModal(true)}
      >
        <MaterialIcons
          name="add-circle-outline"
          size={32}
          color={colors.icon}
        />
        <ThemedText style={[styles.addButtonText, { color: colors.textMuted }]}>
          Add Habit
        </ThemedText>
      </Pressable>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <ThemedView
          style={[styles.modalContainer, themeStyles.screen]}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add New Habit</ThemedText>
            <Pressable onPress={() => setShowModal(false)}>
              <MaterialIcons
                name="close"
                size={28}
                color={colors.text}
              />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name */}
            <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Habit Name</ThemedText>
              <TextInput
                style={themeStyles.input}
                placeholder="Enter habit name..."
                placeholderTextColor={colors.placeholder}
                value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
            </View>

            {/* Emoji */}
            <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Emoji</ThemedText>
              <TextInput
                  style={[styles.emojiInput, themeStyles.input]}
                  value={formData.emoji}
                  onChangeText={(text) => setFormData({ ...formData, emoji: text })}
                  maxLength={2}
                />
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Category</ThemedText>
              <View style={styles.categoryGrid}>
                {CATEGORY_KEYS.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.categoryOption,
                        formData.category === cat && {
                          backgroundColor: CATEGORY_COLORS[cat].mid,
                        },
                        formData.category !== cat && {
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, category: cat })
                      }
                    >
                      <ThemedText
                        style={[
                          styles.categoryOptionText,
                          {
                            color:
                              formData.category === cat
                                ? colors.onPrimary
                                : colors.textMuted,
                          },
                        ]}
                      >
                        {t(CATEGORY_TRANSLATION_KEY[cat])}
                      </ThemedText>
                    </Pressable>
                ))}
              </View>
            </View>

            {/* Frequency Type */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Frequency Type</ThemedText>
              <View style={styles.frequencyGrid}>
                {(['per_day', 'times_per_day', 'times_per_week'] as FrequencyType[]).map(
                  (freq) => (
                    <Pressable
                      key={freq}
                      style={[
                        styles.frequencyOption,
                        formData.frequency_type === freq && {
                          backgroundColor: colors.tint,
                        },
                        formData.frequency_type !== freq && {
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          frequency_type: freq,
                        })
                      }
                    >
                      <ThemedText
                        style={[
                          styles.frequencyOptionText,
                          {
                            color:
                              formData.frequency_type === freq
                                ? colors.onPrimary
                                : colors.textMuted,
                          },
                        ]}
                      >
                        {freq === 'per_day'
                          ? 'Time/Day'
                          : freq === 'times_per_day'
                            ? 'Count/Day'
                            : 'Count/Week'}
                      </ThemedText>
                    </Pressable>
                  )
                )}
              </View>
            </View>

            {/* Target Value */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Target Value</ThemedText>
              <TextInput
                style={themeStyles.input}
                placeholder="60"
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
                value={String(formData.target_value)}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    target_value: parseInt(text) || 0,
                  })
                }
              />
            </View>

            {/* Min Value */}
            {formData.frequency_type === 'per_day' && (
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Min Value</ThemedText>
                <TextInput
                  style={themeStyles.input}
                  placeholder="30"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  value={String(formData.min_value)}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      min_value: parseInt(text) || 0,
                    })
                  }
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <Pressable style={[styles.button, themeStyles.secondaryButton]} onPress={() => setShowModal(false)}>
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={[styles.button, themeStyles.primaryButton]} onPress={handleAddHabit}>
                <ThemedText style={[styles.buttonText, { color: colors.onPrimary }]}>Add Habit</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 14,
    marginVertical: 10,
    borderLeftWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  emojiInput: {
    fontSize: 32,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  frequencyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyOptionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
