// components/celebration-modal.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Avatar } from './avatar/avatar';
import { useAppTheme } from '@/hooks/use-app-theme';

interface CelebrationModalProps {
  visible: boolean;
  wolfName: string;
  oldAvatarScore: number;
  newAvatarScore: number;
  onContinue: () => void;
}

export function CelebrationModal({
  visible,
  wolfName,
  oldAvatarScore,
  newAvatarScore,
  onContinue,
}: CelebrationModalProps) {
  const { colors } = useAppTheme();
  const animationProgress = useSharedValue(0);
  const [showNewAvatar, setShowNewAvatar] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Avatar morphing animation (0 = old, 1 = new)
  const oldAvatarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0, 0.5],
      [1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      animationProgress.value,
      [0, 0.5],
      [1, 0.8],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const newAvatarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0.5, 1],
      [0, 1],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      animationProgress.value,
      [0.5, 1],
      [0.8, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const handleContinue = () => {
    if (animationComplete) {
      onContinue();
      return;
    }

    // Show new avatar overlay
    setShowNewAvatar(true);

    animationProgress.value = withTiming(1, {
      duration: 700,
      easing: Easing.inOut(Easing.ease),
    }, () => {
      setAnimationComplete(true);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.overlay }]}>
        <ThemedView style={styles.modal}>
          {/* Avatar morphing container */}
          <View style={styles.avatarContainer}>
            <Animated.View style={[styles.avatarWrapper, oldAvatarAnimatedStyle]}>
              <Avatar score={oldAvatarScore} size="large" />
            </Animated.View>
            {showNewAvatar && (
              <Animated.View
                style={[
                  styles.avatarWrapper,
                  styles.newAvatarOverlay,
                  newAvatarAnimatedStyle,
                ]}
              >
                <Avatar score={newAvatarScore} size="large" />
              </Animated.View>
            )}
          </View>

          {/* Celebration text */}
          <View style={styles.textContainer}>
            <ThemedText
              style={styles.celebrationText}
              type="title"
            >
              {wolfName} a évolué{'\n'}grâce à toi! 🌟
            </ThemedText>
          </View>

          {/* Continue button */}
          <Pressable
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleContinue}
          >
            <ThemedText style={styles.buttonText}>
              {animationComplete ? 'Continuer' : 'Continuer'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
  },
  avatarContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: 200,
    position: 'relative',
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: 200,
  },
  newAvatarOverlay: {
    position: 'absolute',
  },
  textContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  celebrationText: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
