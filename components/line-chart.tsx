import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import Svg, { Path, Defs, LinearGradient, Stop, TSpan, Line } from 'react-native-svg';
import { DataPoint } from '@/lib/chart-data';

interface LineChartProps {
  title: string;
  data: DataPoint[];
  color: string;
}

export function LineChart({ title, data, color }: LineChartProps) {
  const { colors } = useAppTheme();
  const screenWidth = Dimensions.get('window').width;

  // Chart dimensions - more width, less height
  const chartWidth = screenWidth - 32;
  const chartHeight = 100;
  const labelHeight = 24;
  const padding = { top: 0, right: 12, bottom: 0, left: 12 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight;

  // If no data, return empty
  if (data.length === 0) {
    return (
      <View style={styles.chartSection}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <View style={[styles.emptyChart, { backgroundColor: colors.surfaceRaised }]} />
      </View>
    );
  }

  const getPointX = (index: number) =>
    padding.left + (index / Math.max(1, data.length - 1)) * innerWidth;
  const getPointY = (value: number) => innerHeight - (value / 100) * innerHeight;

  const generatePath = (): string => {
    let path = '';
    for (let i = 0; i < data.length; i++) {
      const x = getPointX(i);
      const y = getPointY(data[i].value);

      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        const prevX = getPointX(i - 1);
        const prevY = getPointY(data[i - 1].value);
        const controlX = (prevX + x) / 2;
        const controlY = prevY;
        path += ` Q ${controlX} ${controlY} ${x} ${y}`;
      }
    }
    return path;
  };

  const generateFillPath = (): string => {
    let path = generatePath();
    const lastX = getPointX(data.length - 1);
    const lastY = getPointY(data[data.length - 1].value);
    const firstX = getPointX(0);
    path += ` L ${lastX} ${innerHeight} L ${firstX} ${innerHeight} Z`;
    return path;
  };

  // Select labels to show (max 5 for readability)
  const labelIndices = data.length > 5
    ? [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1]
    : data.map((_, i) => i);

  const gradientAlpha = '0.25';

  return (
    <View style={styles.chartSection}>
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <View>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id={`grad-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity={gradientAlpha} />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* 100% reference line */}
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left + innerWidth}
            y2={padding.top}
            stroke={colors.chartAxis}
            strokeWidth="0.5"
          />

          {/* Fill under curve */}
          <Path
            d={generateFillPath()}
            fill={`url(#grad-${title})`}
          />

          {/* Line */}
          <Path
            d={generatePath()}
            stroke={color}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>

        {/* X-axis labels */}
        <View style={[styles.labelsContainer, { height: labelHeight }]}>
          {labelIndices.map((idx, arrayIdx) => {
            const label = data[idx].label;
            const xPercent = (idx / Math.max(1, data.length - 1)) * 100;
            let marginLeft = -20; // Default centered

            // Adjust first and last labels to stay within bounds
            if (arrayIdx === 0) {
              marginLeft = 0; // Shift right (no left margin)
            } else if (arrayIdx === labelIndices.length - 1) {
              marginLeft = -40; // Shift left (full width to the left)
            }

            return (
              <Text
                key={idx}
                style={[
                  styles.label,
                  {
                    color: colors.chartMuted,
                    left: `${xPercent}%`,
                    marginLeft,
                  },
                ]}
              >
                {label}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyChart: {
    height: 100,
    borderRadius: 6,
  },
  labelsContainer: {
    position: 'relative',
    width: '100%',
  },
  label: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: -20,
    width: 40,
    textAlign: 'center',
  },
});
