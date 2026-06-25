import { View, StyleSheet, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppTheme } from '@/hooks/use-app-theme';

interface SliderInputProps {
  value: number; // in minutes
  min: number;
  max: number;
  step?: number;
  accentColor: string;
  onValueChange: (value: number) => void;
}

export function SliderInput({
  value,
  min,
  max,
  step = 1,
  accentColor,
  onValueChange,
}: SliderInputProps) {
  const { colors } = useAppTheme();

  // Smart rounding for display: round to nearest sensible value
  const smartRound = (val: number): number => {
    if (max <= 60) {
      // Minutes: round to nearest 5
      return Math.round(val / 5) * 5;
    }
    // Hours: round to nearest 15 minutes
    return Math.round(val / 15) * 15;
  };

  const displayValue = smartRound(value);

  const formatTime = (minutes: number): string => {
    const rounded = smartRound(minutes);
    if (max <= 60) {
      return `${rounded}m`;
    }
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleSliderChange = (newValue: number) => {
    // Round to smart value before updating
    const rounded = smartRound(newValue);
    onValueChange(rounded);
  };

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={0.5}
        value={displayValue}
        onValueChange={handleSliderChange}
        minimumTrackTintColor={accentColor}
        maximumTrackTintColor={colors.border}
        thumbTintColor={accentColor}
      />
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSubtle }]}>
          {formatTime(min)}
        </Text>
        <Text style={[styles.value, { color: accentColor }]}>
          {formatTime(displayValue)}
        </Text>
        <Text style={[styles.label, { color: colors.textSubtle }]}>
          {formatTime(max)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  slider: {
    height: 40,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 32,
  },
});
