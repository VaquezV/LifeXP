import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Stop,
  Text,
} from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedText = Animated.createAnimatedComponent(Text);

const SCORE_STOPS = [0, 20, 40, 60, 80, 95, 100];

interface WeeklyMascotProps {
  score: number;
  accentColor: string;
}

export function WeeklyMascot({ score, accentColor }: WeeklyMascotProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scoreProgress = useSharedValue(score);
  const floatLoop = useSharedValue(0);
  const pulseLoop = useSharedValue(0);
  const burst = useSharedValue(0);

  // Color palettes for each state
  const bodyPalette = useMemo(
    () => ['#8b3a3a', '#7a5c7c', '#6b7a8a', '#4a9b7f', '#2ec573', '#00ff88', '#00ff88'],
    []
  );
  const strokePalette = useMemo(
    () => ['#c62828', '#9575b0', '#8a9aaa', '#7dbfb0', '#5fdd9b', '#7fffd4', '#7fffd4'],
    []
  );
  const footPalette = useMemo(
    () => ['#c62828', '#9575b0', '#8a9aaa', '#7dbfb0', '#5fdd9b', '#5fdd9b', '#00ff88'],
    []
  );

  const faceColor = '#2a2a2a';

  useEffect(() => {
    floatLoop.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    pulseLoop.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [floatLoop, pulseLoop]);

  useEffect(() => {
    scoreProgress.value = withSpring(score, {
      damping: 15,
      stiffness: 120,
      mass: 0.9,
    });
    burst.value = 0;
    burst.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 540, easing: Easing.inOut(Easing.quad) })
    );
  }, [burst, score, scoreProgress]);

  const wrapperStyle = useAnimatedStyle(() => {
    const energyLift = interpolate(scoreProgress.value, [0, 100], [0, -10]);
    const bob = interpolate(floatLoop.value, [0, 1], [5, -5]);
    const bounce = score >= 80 ? interpolate(burst.value, [0, 1], [0, -20]) : 0;
    const scale = 1 + interpolate(scoreProgress.value, [0, 100], [0, 0.08]) + burst.value * 0.05;

    return {
      transform: [{ translateY: bob + energyLift + bounce }, { scale }],
    };
  });

  // Body shape transitions
  const bodyProps = useAnimatedProps(() => ({
    cx: 120,
    cy: interpolate(scoreProgress.value, [0, 100], [130, 112]),
    rx: interpolate(scoreProgress.value, [0, 100], [48, 58]),
    ry: interpolate(scoreProgress.value, [0, 100], [55, 55]),
    fill: interpolateColor(scoreProgress.value, SCORE_STOPS, bodyPalette),
    stroke: interpolateColor(scoreProgress.value, SCORE_STOPS, strokePalette),
    strokeWidth: 4,
  }));

  // Antenna - curved for exhausted, straight for others
  const antennaStemProps = useAnimatedProps(() => {
    const isExhausted = scoreProgress.value < 20;
    const topY = interpolate(scoreProgress.value, [0, 100], [50, -10]);

    if (isExhausted) {
      // Curved antenna for exhausted
      const controlX = interpolate(scoreProgress.value, [0, 20], [110, 120]);
      const endX = interpolate(scoreProgress.value, [0, 20], [100, 120]);
      return {
        d: `M 120 85 Q ${controlX} 65 ${endX} ${topY + 35}`,
        stroke: interpolateColor(scoreProgress.value, SCORE_STOPS, strokePalette),
        strokeWidth: 4,
      };
    }

    // Straight antenna for other states
    return {
      d: `M 120 75 L 120 ${topY}`,
      stroke: interpolateColor(scoreProgress.value, SCORE_STOPS, strokePalette),
      strokeWidth: 4,
    };
  });

  const antennaCoreProps = useAnimatedProps(() => ({
    cx: interpolate(scoreProgress.value, [0, 20], [100, 120]),
    cy: interpolate(scoreProgress.value, [0, 100], [42, -15]),
    r: interpolate(scoreProgress.value, [0, 100], [6, 14]),
    fill: interpolateColor(scoreProgress.value, SCORE_STOPS, bodyPalette),
    stroke: interpolateColor(scoreProgress.value, SCORE_STOPS, strokePalette),
    strokeWidth: 3,
  }));

  // Eyes
  const leftEyeProps = useAnimatedProps(() => ({
    cx: 98,
    cy: interpolate(scoreProgress.value, [0, 100], [118, 103]),
    rx: interpolate(scoreProgress.value, [0, 100], [9, 13]),
    ry: interpolate(scoreProgress.value, SCORE_STOPS, [1, 8, 5, 6, 13, 16, 16]),
    fill: faceColor,
  }));

  const rightEyeProps = useAnimatedProps(() => ({
    cx: 142,
    cy: interpolate(scoreProgress.value, [0, 100], [118, 103]),
    rx: interpolate(scoreProgress.value, [0, 100], [9, 13]),
    ry: interpolate(scoreProgress.value, SCORE_STOPS, [1, 8, 5, 6, 13, 16, 16]),
    fill: faceColor,
  }));

  // Eye shine opacity
  const eyeShineOpacity = interpolate(scoreProgress.value, [40, 60, 100], [0, 0.5, 0.9]);

  // Eyebrows - straight for happy/epic
  const leftBrowProps = useAnimatedProps(() => {
    const isHappyOrEpic = scoreProgress.value >= 80;
    const y1 = isHappyOrEpic ? 82 : interpolate(scoreProgress.value, [0, 100], [110, 95]);
    const y2 = isHappyOrEpic
      ? 82
      : interpolate(scoreProgress.value, SCORE_STOPS, [110, 115, 100, 95, 82, 72, 72]);

    return {
      x1: 88,
      y1,
      x2: 108,
      y2,
      stroke: faceColor,
      strokeWidth: 4,
    };
  });

  const rightBrowProps = useAnimatedProps(() => {
    const isHappyOrEpic = scoreProgress.value >= 80;
    const y1 = isHappyOrEpic ? 82 : interpolate(scoreProgress.value, [0, 100], [110, 95]);
    const y2 = isHappyOrEpic
      ? 82
      : interpolate(scoreProgress.value, SCORE_STOPS, [110, 115, 100, 95, 82, 72, 72]);

    return {
      x1: 132,
      y1: y2,
      x2: 150,
      y2: y1,
      stroke: faceColor,
      strokeWidth: 4,
    };
  });

  // Mouth
  const mouthProps = useAnimatedProps(() => {
    const width = interpolate(scoreProgress.value, [0, 100], [10, 28]);
    const baseY = 150;
    const curveY = interpolate(scoreProgress.value, SCORE_STOPS, [155, 155, 155, 158, 165, 165, 165]);

    return {
      d: `M ${120 - width} ${baseY} Q 120 ${curveY} ${120 + width} ${baseY}`,
      stroke: faceColor,
      strokeWidth: interpolate(scoreProgress.value, [0, 40, 80, 100], [5, 6, 6, 7]),
      fill: 'none',
    };
  });

  // Tears (only for sad state)
  const tearOpacity = interpolate(scoreProgress.value, [15, 40, 50], [0, 1, 0.5]);

  const leftTearProps = useAnimatedProps(() => ({
    x1: 98,
    y1: 128,
    x2: 98,
    y2: 152,
    stroke: '#6ba3ff',
    strokeWidth: 6,
    opacity: tearOpacity,
  }));

  const rightTearProps = useAnimatedProps(() => ({
    x1: 142,
    y1: 128,
    x2: 142,
    y2: 152,
    stroke: '#6ba3ff',
    strokeWidth: 6,
    opacity: tearOpacity,
  }));

  // Cheeks
  const cheekProps = useAnimatedProps(() => ({
    r: 9,
    opacity: interpolate(scoreProgress.value, [40, 60, 100], [0, 0.3, 0.6]),
    fill: '#ffb3ba',
  }));

  // Aura for happy/epic
  const auraProps = useAnimatedProps(() => ({
    cx: 120,
    cy: 120,
    r: interpolate(scoreProgress.value, [75, 100], [65, 80]),
    fill: interpolateColor(scoreProgress.value, [75, 100], ['#5fdd9b', '#7fffd4']),
    opacity: interpolate(scoreProgress.value, [75, 100], [0.05, 0.16]),
  }));

  // Epic ring
  const epicRingProps = useAnimatedProps(() => ({
    cx: 120,
    cy: 120,
    r: 85 + pulseLoop.value * 10,
    fill: 'none',
    stroke: '#00ff88',
    strokeWidth: 3,
    opacity: interpolate(scoreProgress.value, [85, 95, 100], [0, 0.3, 0.7]) *
      (1 - pulseLoop.value * 0.35),
  }));

  // Sparkles
  const sparkLeftProps = useAnimatedProps(() => ({
    cx: 40 - pulseLoop.value * 3,
    cy: 90 - pulseLoop.value * 10,
    r: 3 + pulseLoop.value * 1.5,
    fill: '#ffff00',
    opacity: interpolate(scoreProgress.value, [75, 95, 100], [0, 0.45, 0.88]),
  }));

  const sparkTopProps = useAnimatedProps(() => ({
    cx: 120,
    cy: 20 - pulseLoop.value * 4,
    r: 4 + pulseLoop.value * 2,
    fill: '#ffffff',
    opacity: interpolate(scoreProgress.value, [82, 95, 100], [0, 0.4, 0.92]),
  }));

  const sparkRightProps = useAnimatedProps(() => ({
    cx: 200 + pulseLoop.value * 3,
    cy: 96 - pulseLoop.value * 8,
    r: 3 + pulseLoop.value * 1.5,
    fill: '#ffff00',
    opacity: interpolate(scoreProgress.value, [75, 95, 100], [0, 0.45, 0.88]),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mascotWrap, wrapperStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 240 220">
          <Defs>
            <LinearGradient id="mascotBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Aura (for happy/epic states) */}
          <AnimatedCircle animatedProps={auraProps} />

          {/* Epic ring */}
          <AnimatedCircle animatedProps={epicRingProps} />

          {/* Body */}
          <AnimatedEllipse animatedProps={bodyProps} />

          {/* Shadow */}
          <Ellipse cx={120} cy={188} rx={30} ry={10} fill="#000000" opacity={0.22} />

          {/* Highlight */}
          <Ellipse cx={102} cy={96} rx={20} ry={12} fill="url(#mascotBeam)" />

          {/* Antenna */}
          <AnimatedPath
            animatedProps={antennaStemProps}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedCircle animatedProps={antennaCoreProps} />

          {/* Eyebrows */}
          <AnimatedLine animatedProps={leftBrowProps} strokeLinecap="round" />
          <AnimatedLine animatedProps={rightBrowProps} strokeLinecap="round" />

          {/* Eyes */}
          <AnimatedEllipse animatedProps={leftEyeProps} />
          <AnimatedEllipse animatedProps={rightEyeProps} />

          {/* Eye shine */}
          <Circle cx={101} cy={101} r={2.5} fill="#ffffff" opacity={eyeShineOpacity} />
          <Circle cx={145} cy={101} r={2.5} fill="#ffffff" opacity={eyeShineOpacity} />

          {/* Stars in eyes (epic only) */}
          <Polygon
            points={[98, 85, 102, 95, 94, 95].join(',')}
            fill="#ffff00"
            opacity={interpolate(scoreProgress.value, [90, 100], [0, 0.8])}
          />
          <Polygon
            points={[98, 121, 102, 111, 94, 111].join(',')}
            fill="#ffff00"
            opacity={interpolate(scoreProgress.value, [90, 100], [0, 0.8])}
          />
          <Polygon
            points={[142, 85, 146, 95, 138, 95].join(',')}
            fill="#ffff00"
            opacity={interpolate(scoreProgress.value, [90, 100], [0, 0.8])}
          />
          <Polygon
            points={[142, 121, 146, 111, 138, 111].join(',')}
            fill="#ffff00"
            opacity={interpolate(scoreProgress.value, [90, 100], [0, 0.8])}
          />

          {/* Cheeks */}
          <AnimatedCircle animatedProps={cheekProps} cx={78} cy={146} />
          <AnimatedCircle animatedProps={cheekProps} cx={162} cy={146} />

          {/* Mouth */}
          <AnimatedPath animatedProps={mouthProps} strokeLinecap="round" strokeLinejoin="round" />

          {/* Tears (sad state) */}
          <AnimatedLine animatedProps={leftTearProps} strokeLinecap="round" />
          <AnimatedLine animatedProps={rightTearProps} strokeLinecap="round" />

          {/* Tear drops */}
          <Circle cx={98} cy={157} r={3.5} fill="#6ba3ff" opacity={tearOpacity} />
          <Circle cx={142} cy={157} r={3.5} fill="#6ba3ff" opacity={tearOpacity} />

          {/* Feet */}
          <Circle cx={95} cy={185} r={8} fill={interpolateColor(scoreProgress.value, SCORE_STOPS, footPalette)} opacity={0.75} />
          <Circle cx={145} cy={185} r={8} fill={interpolateColor(scoreProgress.value, SCORE_STOPS, footPalette)} opacity={0.75} />

          {/* Sleeping Z's (exhausted state) */}
          <AnimatedText
            x={160}
            y={100}
            fontSize={24}
            fill={interpolateColor(scoreProgress.value, [0, 20], ['#c62828', 'transparent'])}
            opacity={interpolate(scoreProgress.value, [0, 20], [0.6, 0])}
          >
            Z
          </AnimatedText>

          {/* Sparkles */}
          <AnimatedCircle animatedProps={sparkLeftProps} />
          <AnimatedCircle animatedProps={sparkTopProps} />
          <AnimatedCircle animatedProps={sparkRightProps} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 170,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrap: {
    width: '100%',
    maxWidth: 220,
    aspectRatio: 1.08,
  },
});
