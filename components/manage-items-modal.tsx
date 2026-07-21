import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { ThemedText } from './themed-text';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getReadableTextColor } from '@/lib/theme-evolution';
import type { Habit } from '@/lib/types';

export interface ManageItemsModalProps {
  visible: boolean;
  habits: Habit[];
  onClose: () => void;
  onAdd: (habit: Partial<Habit>) => void;
  onUpdate: (habitId: string, updates: Partial<Habit>) => void;
  onDelete: (habitId: string) => void;
}

export function ManageItemsModal({
  visible,
  habits,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: ManageItemsModalProps) {
  const theme = useWolfLevelTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  const handleStartEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditEmoji(habit.emoji);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdate(editingId, {
        name: editName.trim(),
        emoji: editEmoji,
      });
      setEditingId(null);
    }
  };

  const handleAddNew = () => {
    if (newName.trim() && newEmoji.trim()) {
      onAdd({
        name: newName.trim(),
        emoji: newEmoji,
      });
      setNewName('');
      setNewEmoji('');
      setShowAddForm(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Gérer les items
          </ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </Pressable>
        </View>

        {/* Items List */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {habits.map((habit) => (
            <View
              key={habit.id}
              style={[
                styles.itemRow,
                {
                  backgroundColor: theme.surface,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              {editingId === habit.id ? (
                // Edit mode
                <View style={styles.editContainer}>
                  <TextInput
                    value={editEmoji}
                    onChangeText={setEditEmoji}
                    maxLength={2}
                    style={[styles.emojiInput, { color: theme.text }]}
                    placeholder="😀"
                    placeholderTextColor={theme.textMuted}
                  />
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[
                      styles.nameInput,
                      { color: theme.text, borderColor: theme.border },
                    ]}
                    placeholder="Nom de l'item"
                    placeholderTextColor={theme.textMuted}
                  />
                  <Pressable
                    onPress={handleSaveEdit}
                    style={[styles.saveButton, { backgroundColor: theme.tint }]}
                  >
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={getReadableTextColor(theme.tint)}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => setEditingId(null)}
                    style={[styles.cancelButton, { backgroundColor: theme.borderSoft }]}
                  >
                    <MaterialIcons name="close" size={20} color={theme.text} />
                  </Pressable>
                </View>
              ) : (
                // View mode
                <View style={styles.viewContainer}>
                  <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
                  <ThemedText style={[styles.itemName, { color: theme.text }]}>
                    {habit.name}
                  </ThemedText>
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => handleStartEdit(habit)}
                      style={[styles.actionButton, { backgroundColor: theme.surfaceRaised }]}
                    >
                      <MaterialIcons name="edit" size={18} color={theme.tint} />
                    </Pressable>
                    <Pressable
                      onPress={() => onDelete(habit.id)}
                      style={[styles.actionButton, { backgroundColor: theme.surfaceRaised }]}
                    >
                      <MaterialIcons name="delete" size={18} color="#ff6b6b" />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Add New Item Form */}
          {showAddForm ? (
            <View
              style={[
                styles.addForm,
                { backgroundColor: theme.surface, borderColor: theme.tint },
              ]}
            >
              <TextInput
                value={newEmoji}
                onChangeText={setNewEmoji}
                maxLength={2}
                style={[styles.emojiInput, { color: theme.text }]}
                placeholder="😀"
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={[
                  styles.nameInput,
                  { color: theme.text, borderColor: theme.border },
                ]}
                placeholder="Nom du nouvel item"
                placeholderTextColor={theme.textMuted}
              />
              <Pressable
                onPress={handleAddNew}
                style={[styles.saveButton, { backgroundColor: theme.tint }]}
              >
                <MaterialIcons
                  name="check"
                  size={20}
                  color={getReadableTextColor(theme.tint)}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowAddForm(false);
                  setNewName('');
                  setNewEmoji('');
                }}
                style={[styles.cancelButton, { backgroundColor: theme.borderSoft }]}
              >
                <MaterialIcons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowAddForm(true)}
              style={[
                styles.addButton,
                { backgroundColor: theme.surface, borderColor: theme.tint },
              ]}
            >
              <MaterialIcons name="add" size={24} color={theme.tint} />
              <ThemedText style={[styles.addButtonText, { color: theme.tint }]}>
                Ajouter un item
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <Pressable
            onPress={onClose}
            style={[styles.closeBottomButton, { backgroundColor: theme.tint }]}
          >
            <ThemedText
              style={[
                styles.closeButtonText,
                { color: getReadableTextColor(theme.tint) },
              ]}
            >
              Fermer
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  itemRow: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emojiInput: {
    fontSize: 18,
    width: 40,
    textAlign: 'center',
    padding: 4,
    borderRadius: 4,
  },
  nameInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  closeBottomButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
});
