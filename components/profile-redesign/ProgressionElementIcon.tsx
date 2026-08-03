// components/profile-redesign/ProgressionElementIcon.tsx
import { ThemedText } from '@/components/themed-text';
import { getReadableTextColor } from '@/lib/theme-evolution';
import { Asset } from 'expo-asset';
import type { ProgressionElement } from '@/lib/types';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

interface ProgressionElementIconProps {
  element: ProgressionElement;
  state: 'unlocked' | 'locked';
  accentColor: string;
  mutedColor: string;
  size?: number;
}

/** Renders one Sanctuaire milestone: first a configured local SVG, then an optional
 * remote image, otherwise an accessible initials fallback. */
export function ProgressionElementIcon({
  element,
  state,
  accentColor,
  mutedColor,
  size = 32,
}: ProgressionElementIconProps) {
  const isLocked = state === 'locked';
  const opacity = isLocked ? 0.35 : 1;
  const localAssetUri = useMemo(
    () => (element.assetSource ? Asset.fromModule(element.assetSource).uri : null),
    [element.assetSource]
  );

  if (localAssetUri) {
    return (
      <View
        accessible
        accessibilityLabel={element.alt}
        accessibilityState={{ disabled: isLocked }}
        style={[styles.localAsset, { width: size, height: size, opacity }]}
      >
        <SvgUri width={size} height={size} uri={localAssetUri} />
      </View>
    );
  }

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
  localAsset: { alignItems: 'center', justifyContent: 'center' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontWeight: '800' },
});
