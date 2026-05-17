import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState(habit?.name || '');
  const [emoji, setEmoji] = useState(habit?.emoji || '');
  const [description, setDescription] = useState(habit?.description || '');
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
      setDescription(habit.description || '');
      setTargetValue(habit.target_value?.toString() || '1');
      setMinValue(habit.min_value?.toString() || '0');
    }
  }, [habit, visible]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name,
        emoji,
        description,
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
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' },
          ]}
        >
          {!showDeleteConfirm ? (
            <>
              <View style={styles.header}>
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? '#ffffff' : '#000000' },
                  ]}
                >
                  {habit ? 'Edit Item' : 'New Item'}
                </Text>
                <Pressable onPress={onClose}>
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={isDark ? '#ffffff' : '#000000'}
                  />
                </Pressable>
              </View>

              <ScrollView style={styles.content}>
                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? '#aaaaaa' : '#666666' },
                    ]}
                  >
                    Emoji
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.emojiInput,
                      {
                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                        color: isDark ? '#ffffff' : '#000000',
                        borderColor: isDark ? '#333333' : '#ddd',
                      },
                    ]}
                    placeholder="🐕"
                    placeholderTextColor={isDark ? '#666666' : '#999999'}
                    value={emoji}
                    onChangeText={setEmoji}
                    maxLength={2}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? '#aaaaaa' : '#666666' },
                    ]}
                  >
                    Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                        color: isDark ? '#ffffff' : '#000000',
                        borderColor: isDark ? '#333333' : '#ddd',
                      },
                    ]}
                    placeholder="Item name"
                    placeholderTextColor={isDark ? '#666666' : '#999999'}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? '#aaaaaa' : '#666666' },
                    ]}
                  >
                    Description (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.descriptionInput,
                      {
                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                        color: isDark ? '#ffffff' : '#000000',
                        borderColor: isDark ? '#333333' : '#ddd',
                      },
                    ]}
                    placeholder="Add notes..."
                    placeholderTextColor={isDark ? '#666666' : '#999999'}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text
                      style={[
                        styles.label,
                        { color: isDark ? '#aaaaaa' : '#666666' },
                      ]}
                    >
                      Target
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                          color: isDark ? '#ffffff' : '#000000',
                          borderColor: isDark ? '#333333' : '#ddd',
                        },
                      ]}
                      placeholder="1"
                      placeholderTextColor={isDark ? '#666666' : '#999999'}
                      value={targetValue}
                      onChangeText={setTargetValue}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.label,
                        { color: isDark ? '#aaaaaa' : '#666666' },
                      ]}
                    >
                      Minimum
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                          color: isDark ? '#ffffff' : '#000000',
                          borderColor: isDark ? '#333333' : '#ddd',
                        },
                      ]}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#666666' : '#999999'}
                      value={minValue}
                      onChangeText={setMinValue}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.actions}>
                {habit && onDelete && (
                  <Pressable
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <MaterialIcons name="delete" size={20} color="#f44336" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                )}
                <View style={styles.mainActions}>
                  <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        { color: isDark ? '#ffffff' : '#000000' },
                      ]}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.confirmContainer}>
              <MaterialIcons name="warning" size={48} color="#f44336" />
              <Text
                style={[
                  styles.confirmTitle,
                  { color: isDark ? '#ffffff' : '#000000' },
                ]}
              >
                Delete &quot;{name}&quot;?
              </Text>
              <Text
                style={[
                  styles.confirmText,
                  { color: isDark ? '#aaaaaa' : '#666666' },
                ]}
              >
                This will delete the item and all its history.
              </Text>

              <View style={styles.confirmActions}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: isDark ? '#ffffff' : '#000000' },
                    ]}
                  >
                    Keep
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => {
                    onDelete?.();
                    onClose();
                  }}
                >
                  <Text style={[styles.buttonText, { color: '#ffffff' }]}>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
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
    borderTopWidth: 1,
    borderTopColor: '#333333',
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
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#333333',
  },
  saveButton: {
    backgroundColor: '#2a9d8f',
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
