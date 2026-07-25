import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { ThemedText } from './themed-text';
import { AddHabitModal } from './add-habit-modal';
import { HabitModal } from './habit-modal';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getReadableTextColor } from '@/lib/theme-evolution';
import type { CategoryType, Habit, PresetHabit } from '@/lib/types';

export interface ManageItemsModalProps {
  visible: boolean;
  category: CategoryType | null;
  presets: PresetHabit[];
  habits: Habit[];
  onClose: () => void;
  onAdd: (habit: Partial<Habit>) => void;
  onUpdate: (habitId: string, updates: Partial<Habit>) => void;
  onDelete: (habitId: string) => void;
}

export function ManageItemsModal({
  visible,
  category,
  presets,
  habits,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: ManageItemsModalProps) {
  const theme = useWolfLevelTheme();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

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
              <View style={styles.viewContainer}>
                <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
                <ThemedText style={[styles.itemName, { color: theme.text }]}>
                  {habit.name}
                </ThemedText>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => setEditingHabit(habit)}
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
            </View>
          ))}

          {/* Add New Item */}
          <Pressable
            onPress={() => setAddModalVisible(true)}
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

      <AddHabitModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={async (habit) => {
          onAdd(habit);
          setAddModalVisible(false);
        }}
        presets={presets}
        defaultCategory={category ?? undefined}
      />

      <HabitModal
        visible={editingHabit !== null}
        habit={editingHabit ?? undefined}
        onClose={() => setEditingHabit(null)}
        onSave={(updates) => {
          if (editingHabit) onUpdate(editingHabit.id, updates);
          setEditingHabit(null);
        }}
        onDelete={() => {
          if (editingHabit) onDelete(editingHabit.id);
          setEditingHabit(null);
        }}
      />
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
