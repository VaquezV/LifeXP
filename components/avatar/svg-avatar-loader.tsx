import { memo, useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { EmotionalState } from '@/lib/avatars';

interface SVGAvatarLoaderProps {
  svgPath: string;
  state: EmotionalState;
  accentColor: string;
  scale?: number;
}

const DOG_AVATAR_ASSETS = {
  'dog.0-10.svg': require('@/assets/avatars/dog.0-10.svg'),
  'dog.11-20.svg': require('@/assets/avatars/dog.11-20.svg'),
  'dog.21-30.svg': require('@/assets/avatars/dog.21-30.svg'),
  'dog.31-40.svg': require('@/assets/avatars/dog.31-40.svg'),
  'dog.41-50.svg': require('@/assets/avatars/dog.41-50.svg'),
  'dog.51-60.svg': require('@/assets/avatars/dog.51-60.svg'),
  'dog.61-70.svg': require('@/assets/avatars/dog.61-70.svg'),
  'dog.71-80.svg': require('@/assets/avatars/dog.71-80.svg'),
  'dog.81-90.svg': require('@/assets/avatars/dog.81-90.svg'),
  'dog.91-100.svg': require('@/assets/avatars/dog.91-100.svg'),
} as const;

function SVGAvatarLoaderComponent({
  svgPath,
  state,
  accentColor,
  scale = 1,
}: SVGAvatarLoaderProps) {
  const assetUri = useMemo(() => {
    const asset = DOG_AVATAR_ASSETS[svgPath as keyof typeof DOG_AVATAR_ASSETS];
    if (asset) {
      const resolved = Image.resolveAssetSource(asset);
      return resolved.uri;
    }
    return null;
  }, [svgPath]);

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={styles.background}>
        {assetUri && (
          <SvgUri
            width={200}
            height={220}
            uri={assetUri}
          />
        )}
      </View>
    </View>
  );
}

export const SVGAvatarLoader = memo(SVGAvatarLoaderComponent);

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    width: 230,
    height: 245,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
});
