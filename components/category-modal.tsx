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
import { useAppTheme } from '@/hooks/use-app-theme';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
}

const COLORS = [
  '#2a9d8f', '#f38181', '#aa96da', '#5dade2',
  '#ffd93d', '#ff9800', '#4caf50', '#e91e63',
  '#00bcd4', '#ff5722',
];

export function CategoryModal({
  visible,
  onClose,
  onSave,
  initialName = '',
  initialColor = '#2a9d8f',
}: CategoryModalProps) {
  const { colors, styles: themeStyles } = useAppTheme();

  const [name, setName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  useEffect(() => {
    setName(initialName);
    setSelectedColor(initialColor);
  }, [initialName, initialColor, visible]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name, selectedColor);
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
            themeStyles.surfaceRaised,
          ]}
        >
          <Text
            style={[styles.title, { color: colors.text }]}
          >
            {initialName ? 'Edit Category' : 'New Category'}
          </Text>

          <TextInput
            style={[
              styles.input,
              themeStyles.input,
            ]}
            placeholder="Category name"
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
          />

          <Text
            style={[styles.label, { color: colors.textMuted }]}
          >
            Choose Color
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.colorScroll}
          >
            {COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: color,
                    borderWidth: selectedColor === color ? 3 : 0,
                    borderColor: selectedColor === color ? colors.onPrimary : 'transparent',
                  },
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, themeStyles.secondaryButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: selectedColor },
              ]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                Save
              </Text>
            </Pressable>
          </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorScroll: {
    marginBottom: 24,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
