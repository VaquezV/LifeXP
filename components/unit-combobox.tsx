import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DEFAULT_UNITS, fetchUserUnits } from '@/lib/units';

interface UnitComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

/** Free-text unit field with suggestions from DEFAULT_UNITS + the user's previously typed units. */
export function UnitCombobox({ value, onChange }: UnitComboboxProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const [userUnits, setUserUnits] = useState<string[]>([]);

  useEffect(() => {
    fetchUserUnits().then(setUserUnits).catch(() => setUserUnits([]));
  }, []);

  const suggestions = useMemo(() => {
    const all = [...DEFAULT_UNITS, ...userUnits];
    const unique = Array.from(new Set(all));
    const query = value.trim().toLowerCase();
    if (!query) return unique;
    return unique.filter(u => u.toLowerCase().includes(query));
  }, [userUnits, value]);

  return (
    <View>
      <TextInput
        style={[styles.textInput, themeStyles.input]}
        value={value}
        onChangeText={onChange}
        placeholder="ex: pas, kcal, km..."
        placeholderTextColor={colors.textSubtle}
      />
      {suggestions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionRow}>
          {suggestions.map(unit => (
            <Pressable
              key={unit}
              style={[
                styles.chip,
                unit === value
                  ? { backgroundColor: colors.tint }
                  : { borderWidth: 1, borderColor: colors.borderSoft },
              ]}
              onPress={() => onChange(unit)}
            >
              <ThemedText style={[styles.chipText, { color: unit === value ? colors.onPrimary : colors.textMuted }]}>
                {unit}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  suggestionRow: {
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
