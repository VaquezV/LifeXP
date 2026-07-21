import { CATEGORY_COLORS } from '@/constants/Colors';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { ensureContrast, getReadableTextColor } from '@/lib/theme-evolution';
import type { CategoryType, Habit } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

export interface CheckinItemSimplifiedProps {
  habit: Habit;
  value: number;
  onValueChange: (newValue: number) => void;
}

export function CheckinItemSimplified({
  habit,
  value,
  onValueChange,
}: CheckinItemSimplifiedProps) {
  const theme = useWolfLevelTheme();
  const categoryColor = CATEGORY_COLORS[habit.category as CategoryType];
  const accentColor = ensureContrast(categoryColor.mid, theme.surface, 4.5);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStepSize = (targetValue: number, minValue?: number) => {
    if (habit.frequency_type === 'per_day') {
      const min = minValue || habit.min_value;
      const range = targetValue - min;
      if (range < 30) return 5;
      if (range < 60) return 15;
      if (range < 300) return 30;
      return 60;
    }
    return 1;
  };

  const stepSize = getStepSize(habit.target_value, habit.min_value);

  const availableValues = useMemo(() => {
    if (habit.frequency_type === 'times_per_week') {
      return [0, 1];
    }
    if (habit.frequency_type === 'times_per_day') {
      return Array.from({ length: habit.target_value + 1 }, (_, i) => i);
    }
    // per_day: build stepping
    const values: number[] = [];
    for (let i = habit.min_value; i <= habit.target_value; i += stepSize) {
      values.push(i);
    }
    if (values[values.length - 1] !== habit.target_value) {
      values.push(habit.target_value);
    }
    return values;
  }, [habit, stepSize]);

  const toggleYesNo = (yesValue: number) => {
    onValueChange(value === yesValue ? 0 : yesValue);
  };

  const formatValue = (v: number) => {
    if (habit.frequency_type === 'per_day') {
      if (v < 60) return `${v}m`;
      const hours = Math.floor(v / 60);
      const mins = v % 60;
      return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
    }
    return v.toString();
  };

  const handleDecrement = () => {
    const idx = availableValues.indexOf(value);
    if (idx > 0) {
      onValueChange(availableValues[idx - 1]);
    }
  };

  const handleIncrement = () => {
    const idx = availableValues.indexOf(value);
    if (idx < availableValues.length - 1) {
      onValueChange(availableValues[idx + 1]);
    }
  };

  const renderInteraction = () => {
    // times_per_week ou times_per_day → simple coche (toggle 0/1)
    if (habit.frequency_type === 'times_per_week' || habit.frequency_type === 'times_per_day') {
      return (
        <Pressable
          onPress={() => toggleYesNo(1)}
          style={[
            styles.checkboxButton,
            {
              borderColor: accentColor,
              backgroundColor: value === 1 ? accentColor : 'transparent',
            },
          ]}
        >
          <MaterialIcons
            name={value === 1 ? 'check-circle' : 'radio-button-unchecked'}
            size={18}
            color={value === 1 ? getReadableTextColor(accentColor) : accentColor}
          />
        </Pressable>
      );
    }

    // per_day → [<] dropdown [>]
    return (
      <View style={styles.stepperContainer}>
        <Pressable
          onPress={handleDecrement}
          style={[styles.arrowButton, { borderColor: accentColor }]}
        >
          <ThemedText style={[styles.arrowText, { color: accentColor }]}>‹</ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setDropdownVisible(true)}
          style={[styles.valueDropdown, { borderColor: accentColor }]}
        >
          <ThemedText
            style={[
              styles.valueText,
              { color: accentColor, fontWeight: '700' },
            ]}
          >
            {formatValue(value)}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleIncrement}
          style={[styles.arrowButton, { borderColor: accentColor }]}
        >
          <ThemedText style={[styles.arrowText, { color: accentColor }]}>›</ThemedText>
        </Pressable>
      </View>
    );
  };

  return (
    <>
      <Animated.View
        style={[
          styles.itemRow,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.borderSoft,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.contentWrapper}>
          <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
          <View style={styles.titleContainer}>
            <ThemedText
              style={[styles.habitTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {habit.name}
            </ThemedText>
          </View>
        </View>

        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.interactionWrapper}
        >
          {renderInteraction()}
        </Pressable>
      </Animated.View>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible && habit.frequency_type !== 'times_per_week'}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <Pressable
            style={[
              styles.dropdownMenu,
              { backgroundColor: theme.surface, borderColor: accentColor },
            ]}
            onPress={() => { }}
          >
            <ScrollView
              scrollEnabled={availableValues.length > 5}
              contentContainerStyle={styles.dropdownContent}
            >
              {availableValues.map((v) => (
                <Pressable
                  key={v}
                  onPress={() => {
                    onValueChange(v);
                    setDropdownVisible(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor: v === value ? accentColor : 'transparent',
                      borderBottomColor: theme.borderSoft,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dropdownItemText,
                      {
                        color: v === value ? getReadableTextColor(accentColor) : theme.text,
                        fontWeight: v === value ? '700' : '500',
                      },
                    ]}
                  >
                    {formatValue(v)}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  titleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  interactionWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxButton: {
    width: 30,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  arrowButton: {
    width: 18,
    height: 32,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
  valueDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 35,
  },
  valueText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
    alignSelf: 'center',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    maxWidth: 200,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 280,
    overflow: 'hidden',
  },
  dropdownContent: {
    paddingVertical: 0,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
