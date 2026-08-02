// components/profile-redesign/ProgressionElementIcon.tsx
import { ThemedText } from '@/components/themed-text';
import { getReadableTextColor } from '@/lib/theme-evolution';
import type { ProgressionElement } from '@/lib/types';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface ProgressionElementIconProps {
  element: ProgressionElement;
  state: 'unlocked' | 'locked';
  accentColor: string;
  mutedColor: string;
  size?: number;
}

/** Renders one Sanctuaire milestone: an Image when element.assetPath exists (future real asset), otherwise an accessible circular text placeholder (initials), dimmed when locked. Called by SanctuaryCategoryCard to display unlocked/locked progression elements. */
export function ProgressionElementIcon({
  element,
  state,
  accentColor,
  mutedColor,
  size = 32,
}: ProgressionElementIconProps) {
  const isLocked = state === 'locked';
  const opacity = isLocked ? 0.35 : 1;

  if (element.assetPath) {
    return (
      <Image
        source={{ uri: element.assetPath }}
        accessible
        accessibilityLabel={element.alt}
        accessibilityState={{ disabled: isLocked }}
        style={[styles.image, { width: size, height: size, opacity }]}
      />
    );
  }

  const backgroundColor = isLocked ? mutedColor : accentColor;
  const initials = element.label.slice(0, 2).toUpperCase();

  return (
    <View
      accessible
      accessibilityLabel={element.alt}
      accessibilityState={{ disabled: isLocked }}
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2, backgroundColor, opacity },
      ]}
    >
      <ThemedText style={[styles.placeholderText, { fontSize: size * 0.34, color: getReadableTextColor(backgroundColor) }]}>
        {initials}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { borderRadius: 8 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontWeight: '800' },
});
