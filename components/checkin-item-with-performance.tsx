import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { ensureContrast, getReadableTextColor } from '@/lib/theme-evolution';
import { formatCheckinValue, getAvailableTiers } from '@/lib/checkin-tiers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { CategoryType, Habit } from '@/lib/types';

export interface CheckinItemWithPerformanceProps {
  habit: Habit;
  value: number;
  performanceData: Record<number, number>; // slotIndex -> percentage (0-100)
  onValueChange: (newValue: number) => void;
}

export function CheckinItemWithPerformance({
  habit,
  value,
  performanceData,
  onValueChange,
}: CheckinItemWithPerformanceProps) {
  const theme = useWolfLevelTheme();
  const categoryColor = CATEGORY_COLORS[habit.category as CategoryType];
  const accentColor = ensureContrast(categoryColor.mid, theme.surface, 4.5);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const availableValues = useMemo(() => getAvailableTiers(habit), [habit]);

  const toggleYesNo = (yesValue: number) => {
    onValueChange(value === yesValue ? 0 : yesValue);
  };

  const formatValue = (v: number) => formatCheckinValue(habit, v);

  const getColorWithTransparency = (percentage: number): string => {
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const opacity = 0.15 + (Math.max(0, percentage) / 100) * 0.85;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const gridSquares = useMemo(() => {
    return Object.entries(performanceData).map(([slotStr, percentage]) => ({
      slot: parseInt(slotStr),
      percentage,
    }));
  }, [performanceData]);

  const renderInteraction = () => {
    if (habit.frequency_type === 'times_per_week') {
      return (
        <View style={styles.yesnoContainer}>
          <Pressable
            onPress={() => toggleYesNo(0)}
            style={[
              styles.yesnoButton,
              {
                borderColor: accentColor,
                backgroundColor: value === 0 ? accentColor : 'transparent',
              },
            ]}
          >
            <MaterialIcons
              name={value === 0 ? 'check-circle' : 'radio-button-unchecked'}
              size={20}
              color={value === 0 ? getReadableTextColor(accentColor) : accentColor}
            />
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.dropdownContainer}>
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
          <MaterialIcons
            name="expand-more"
            size={16}
            color={accentColor}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <>
      {/* Item Header */}
      <View
        style={[
          styles.itemHeader,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.borderSoft,
          },
        ]}
      >
        <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
        <View style={styles.titleContainer}>
          <ThemedText
            style={[styles.habitTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {habit.name}
          </ThemedText>
        </View>
        {renderInteraction()}
      </View>

      {/* Performance Grid */}
      <View
        style={[
          styles.performanceContainer,
          { backgroundColor: theme.bgPrimary },
        ]}
      >
        <View
          style={[
            styles.performanceGrid,
            { gap: 1 },
          ]}
        >
          {gridSquares.map((square) => (
            <View
              key={square.slot}
              style={[
                styles.performanceSquare,
                {
                  width: 8,
                  height: 8,
                  backgroundColor: getColorWithTransparency(square.percentage),
                  borderColor: square.percentage === 0 ? theme.borderSoft : 'transparent',
                  borderWidth: square.percentage === 0 ? 0.5 : 0,
                },
              ]}
            />
          ))}
        </View>
      </View>

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
            onPress={() => {}}
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
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  titleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  yesnoContainer: {
    width: 44,
  },
  yesnoButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 60,
    gap: 4,
  },
  valueText: {
    fontSize: 13,
    lineHeight: 18,
  },
  performanceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  performanceSquare: {
    borderRadius: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    maxWidth: 200,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 300,
    overflow: 'hidden',
  },
  dropdownContent: {
    paddingVertical: 0,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
