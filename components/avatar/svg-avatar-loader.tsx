import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { EmotionalState } from '@/lib/avatars';

import Dog0_10 from '@/assets/avatars/dog.0-10.svg';
import Dog11_20 from '@/assets/avatars/dog.11-20.svg';
import Dog21_30 from '@/assets/avatars/dog.21-30.svg';
import Dog31_40 from '@/assets/avatars/dog.31-40.svg';
import Dog41_50 from '@/assets/avatars/dog.41-50.svg';
import Dog51_60 from '@/assets/avatars/dog.51-60.svg';
import Dog61_70 from '@/assets/avatars/dog.61-70.svg';
import Dog71_80 from '@/assets/avatars/dog.71-80.svg';
import Dog81_90 from '@/assets/avatars/dog.81-90.svg';
import Dog91_100 from '@/assets/avatars/dog.91-100.svg';

interface SVGAvatarLoaderProps {
  svgPath: string;
  state: EmotionalState;
  accentColor: string;
  scale?: number;
}

const DOG_AVATAR_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'dog.0-10.svg': Dog0_10,
  'dog.11-20.svg': Dog11_20,
  'dog.21-30.svg': Dog21_30,
  'dog.31-40.svg': Dog31_40,
  'dog.41-50.svg': Dog41_50,
  'dog.51-60.svg': Dog51_60,
  'dog.61-70.svg': Dog61_70,
  'dog.71-80.svg': Dog71_80,
  'dog.81-90.svg': Dog81_90,
  'dog.91-100.svg': Dog91_100,
};

function SVGAvatarLoaderComponent({
  svgPath,
  state,
  accentColor,
  scale = 1,
}: SVGAvatarLoaderProps) {
  const SvgComponent = useMemo(() => DOG_AVATAR_COMPONENTS[svgPath], [svgPath]);

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      {SvgComponent && <SvgComponent width={200} height={220} />}
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
});
