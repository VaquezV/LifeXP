import { useAppTheme } from '@/hooks/use-app-theme';
import { Habit } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface HabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Habit>) => void;
  onDelete?: () => void;
  habit?: Habit;
}

export function HabitModal({
  visible,
  onClose,
  onSave,
  onDelete,
  habit,
}: HabitModalProps) {
  const { colors, styles: themeStyles } = useAppTheme();

  const [name, setName] = useState(habit?.name || '');
  const [emoji, setEmoji] = useState(habit?.emoji || '');
  const [targetValue, setTargetValue] = useState(
    habit?.target_value?.toString() || '1'
  );
  const [minValue, setMinValue] = useState(
    habit?.min_value?.toString() || '0'
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji || '');
      setTargetValue(habit.target_value?.toString() || '1');
      setMinValue(habit.min_value?.toString() || '0');
    }
  }, [habit, visible]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name,
        emoji,
        target_value: parseFloat(targetValue) || 1,
        min_value: parseFloat(minValue) || 0,
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, themeStyles.modalOverlay]}>
        <View
          style={[
            styles.container,
            themeStyles.modalSheet,
          ]}
        >
          {!showDeleteConfirm ? (
            <>
              <View style={styles.header}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                >
                  {habit ? 'Edit Item' : 'New Item'}
                </Text>
                <Pressable onPress={onClose}>
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <ScrollView style={styles.content}>
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.label, { color: colors.textMuted }]}
                  >
                    Emoji
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.emojiInput,
                      themeStyles.input,
                      themeStyles.inputEmoji,
                    ]}
                    placeholder="🐕"
                    placeholderTextColor={colors.placeholder}
                    value={emoji}
                    onChangeText={setEmoji}
                    maxLength={2}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.label, { color: colors.textMuted }]}
                  >
                    Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      themeStyles.input,
                    ]}
                    placeholder="Item name"
                    placeholderTextColor={colors.placeholder}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text
                    style={[styles.label, { color: colors.textMuted }]}
                  >
                    Minimum
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      themeStyles.input,
                    ]}
                    placeholder="0"
                    placeholderTextColor={colors.placeholder}
                    value={minValue}
                    onChangeText={setMinValue}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text
                      style={[styles.label, { color: colors.textMuted }]}
                    >
                      Target
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        themeStyles.input,
                      ]}
                      placeholder="1"
                      placeholderTextColor={colors.placeholder}
                      value={targetValue}
                      onChangeText={setTargetValue}
                      keyboardType="decimal-pad"
                    />
                  </View>


                </View>
              </ScrollView>

              <View style={[styles.actions, themeStyles.dividerTop]}>
                {habit && onDelete && (
                  <Pressable
                    style={[styles.button, themeStyles.dangerButton]}
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <MaterialIcons name="delete" size={20} color={colors.danger} />
                    <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete</Text>
                  </Pressable>
                )}
                <View style={styles.mainActions}>
                  <Pressable
                    style={[styles.button, themeStyles.secondaryButton]}
                    onPress={onClose}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, themeStyles.primaryButton]}
                    onPress={handleSave}
                  >
                    <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.confirmContainer}>
              <MaterialIcons name="warning" size={48} color={colors.danger} />
              <Text
                style={[styles.confirmTitle, { color: colors.text }]}
              >
                Delete &quot;{name}&quot;?
              </Text>
              <Text
                style={[styles.confirmText, { color: colors.textMuted }]}
              >
                This will delete the item and all its history.
              </Text>

              <View style={styles.confirmActions}>
                <Pressable
                  style={[styles.button, themeStyles.secondaryButton]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    Keep
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.button, themeStyles.dangerButton]}
                  onPress={() => {
                    onDelete?.();
                    onClose();
                  }}
                >
                  <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
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
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  emojiInput: {
    fontSize: 24,
    textAlign: 'center',
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  mainActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
  },
  saveButton: {
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
