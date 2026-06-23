import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { CategoryType } from '@/lib/types';
import { getNextTierFileName } from '@/lib/accessoires';

const ACCESSORY_ASSETS = {
  'antre.0-20.svg':   require('@/assets/accessoires/antre.0-20.svg'),
  'antre.21-40.svg':  require('@/assets/accessoires/antre.21-40.svg'),
  'antre.41-60.svg':  require('@/assets/accessoires/antre.41-60.svg'),
  'antre.61-80.svg':  require('@/assets/accessoires/antre.61-80.svg'),
  'antre.81-100.svg': require('@/assets/accessoires/antre.81-100.svg'),
  'cri.0-20.svg':     require('@/assets/accessoires/cri.0-20.svg'),
  'cri.21-40.svg':    require('@/assets/accessoires/cri.21-40.svg'),
  'cri.41-60.svg':    require('@/assets/accessoires/cri.41-60.svg'),
  'cri.61-80.svg':    require('@/assets/accessoires/cri.61-80.svg'),
  'cri.81-100.svg':   require('@/assets/accessoires/cri.81-100.svg'),
  'meute.0-20.svg':   require('@/assets/accessoires/meute.0-20.svg'),
  'meute.21-40.svg':  require('@/assets/accessoires/meute.21-40.svg'),
  'meute.41-60.svg':  require('@/assets/accessoires/meute.41-60.svg'),
  'meute.61-80.svg':  require('@/assets/accessoires/meute.61-80.svg'),
  'meute.81-100.svg': require('@/assets/accessoires/meute.81-100.svg'),
  'totem.0-20.svg':   require('@/assets/accessoires/totem.0-20.svg'),
  'totem.21-40.svg':  require('@/assets/accessoires/totem.21-40.svg'),
  'totem.41-60.svg':  require('@/assets/accessoires/totem.41-60.svg'),
  'totem.61-80.svg':  require('@/assets/accessoires/totem.61-80.svg'),
  'totem.81-100.svg': require('@/assets/accessoires/totem.81-100.svg'),
} as const;

interface AccessoryIconProps {
  category:       CategoryType;
  score:          number;        // 0-100, completionPct — affiche le palier suivant avec overlay
  size?:          number;
  overlayHeight?: number;        // 0-100: % de la hauteur à couvrir depuis le haut. 0 = pas d'overlay.
  overlayColor?:  string;        // defaults to 'rgba(128, 128, 128, 0.6)'
}

function AccessoryIconComponent({
  category,
  score,
  size = 40,
  overlayHeight = 0,
  overlayColor = 'rgba(128, 128, 128, 0.6)',
}: AccessoryIconProps) {
  const uri = useMemo(() => {
    const fileName = getNextTierFileName(category, score);
    const asset = ACCESSORY_ASSETS[fileName as keyof typeof ACCESSORY_ASSETS];
    return asset ? Asset.fromModule(asset).uri : null;
  }, [category, score]);

  const coverPixels = Math.round((overlayHeight / 100) * size);

  if (!uri) return <View style={[styles.container, { width: size, height: size }]} />;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <SvgUri width={size} height={size} uri={uri} />
      {coverPixels > 0 && (
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            {
              height:          coverPixels,
              backgroundColor: overlayColor,
            },
          ]}
        />
      )}
    </View>
  );
}

export const AccessoryIcon = memo(AccessoryIconComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
  },
});
