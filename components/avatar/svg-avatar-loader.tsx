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

const GOT_AVATAR_ASSETS = {
  'got.0-10.svg': require('@/assets/avatars/got.0-10.svg'),
  'got.11-20.svg': require('@/assets/avatars/got.11-20.svg'),
  'got.21-30.svg': require('@/assets/avatars/got.21-30.svg'),
  'got.31-40.svg': require('@/assets/avatars/got.31-40.svg'),
  'got.41-50.svg': require('@/assets/avatars/got.41-50.svg'),
  'got.51-60.svg': require('@/assets/avatars/got.51-60.svg'),
  'got.61-70.svg': require('@/assets/avatars/got.61-70.svg'),
  'got.71-80.svg': require('@/assets/avatars/got.71-80.svg'),
  'got.81-90.svg': require('@/assets/avatars/got.81-90.svg'),
  'got.91-100.svg': require('@/assets/avatars/got.91-100.svg'),
} as const;

const DOG_AVATAR_ASSETS = GOT_AVATAR_ASSETS;

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
      <View style={styles.svgWrapper}>
        {assetUri && (
          <SvgUri
            width={140}
            height={155}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    width: 140,
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
