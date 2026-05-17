import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAvatar, getAvatarByScore, getEmotionalStateFromScore } from '@/lib/avatars';
import { SVGAvatarLoader } from './svg-avatar-loader';

interface AvatarProps {
  score: number;
  accentColor?: string;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = {
  small: { width: 120, height: 130 },
  medium: { width: 180, height: 200 },
  large: { width: 240, height: 270 },
} as const;

function AvatarComponent({ score, accentColor = '#2a9d8f', size = 'medium' }: AvatarProps) {
  const { avatarState, state, config } = useAvatar({ score, accentColor });
  const dimensions = sizeConfig[size];
  const avatarRange = getAvatarByScore(score);
  const emotionalState = getEmotionalStateFromScore(score);

  return (
    <View style={[styles.container, dimensions]}>
      <SVGAvatarLoader
        svgPath={avatarRange.svgFile}
        state={emotionalState}
        accentColor={accentColor}
      />
    </View>
  );
}

export const Avatar = memo(AvatarComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
