import { View, StyleSheet, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formatTime = (minutes: number): string => {
    if (max <= 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={accentColor}
        maximumTrackTintColor={isDark ? '#333333' : '#cccccc'}
        thumbTintColor={accentColor}
      />
      <Text style={[
        styles.value,
        { color: accentColor },
      ]}>
        {formatTime(value)}
      </Text>
      <View style={styles.labels}>
        <Text style={styles.label}>
          {formatTime(min)}
        </Text>
        <Text style={styles.label}>
          {formatTime(max)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  slider: {
    height: 40,
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
  },
});
