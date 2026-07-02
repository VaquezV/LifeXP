// components/celebration-modal.tsx

import React, { useEffect, useRef } from 'react';
import { Modal, View, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Avatar } from './avatar/avatar';
import { useAppTheme } from '@/hooks/use-app-theme';

interface CelebrationModalProps {
  visible: boolean;
  wolfName: string;
  oldAvatarLevel: number;
  newAvatarLevel: number;
  onContinue: () => void;
}

export function CelebrationModal({
  visible,
  wolfName,
  oldAvatarLevel,
  newAvatarLevel,
  onContinue,
}: CelebrationModalProps) {
  const { colors } = useAppTheme();
  const animationProgress = useSharedValue(0);

  const handleContinue = () => {
    animationProgress.value = withTiming(1, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    }, () => {
      // After animation, call onContinue
      onContinue();
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
          {/* Old avatar will be rendered here */}
          <View style={styles.avatarContainer}>
            <Avatar level={oldAvatarLevel} size={200} />
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
            <ThemedText style={styles.buttonText}>Continuer</ThemedText>
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
