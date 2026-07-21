import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { getAvatarByScore, getEmotionalStateFromScore } from '@/lib/avatars';
import { SVGAvatarLoader } from './svg-avatar-loader';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';

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

function AvatarComponent({ score, accentColor, size = 'medium' }: AvatarProps) {
  const theme = useWolfLevelTheme();
  const resolvedAccentColor = accentColor ?? theme.tint;
  const dimensions = sizeConfig[size];
  const avatarRange = getAvatarByScore(score);
  const emotionalState = getEmotionalStateFromScore(score);

  return (
    <View style={[styles.container, dimensions]}>
      <SVGAvatarLoader
        svgPath={avatarRange.svgFile}
        state={emotionalState}
        accentColor={resolvedAccentColor}
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
