import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { getCategoryAvatarAsset } from '@/lib/category-elements-config';
import type { CategoryType } from '@/lib/types';

interface AccessoryIconProps {
  category: CategoryType;
  level: number;
  size?: number;
}

/** Category avatar resolved by the central accessory catalog. */
function AccessoryIconComponent({ category, level, size = 40 }: AccessoryIconProps) {
  const uri = useMemo(() => {
    const asset = getCategoryAvatarAsset(category, level);
    return asset ? Asset.fromModule(asset).uri : null;
  }, [category, level]);

  if (!uri) return <View style={[styles.container, { width: size, height: size }]} />;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <SvgUri width={size} height={size} uri={uri} />
    </View>
  );
}

export const AccessoryIcon = memo(AccessoryIconComponent);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
