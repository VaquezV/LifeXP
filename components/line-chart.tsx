import { StyleSheet, View, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { CATEGORY_COLORS } from '@/constants/Colors';
import { CategoryType } from '@/lib/types';
import { DataPoint, ChartData } from '@/lib/chart-data';

interface LineChartProps {
  data: ChartData;
  showGlobal?: boolean;
  showCategories?: boolean;
}

export function LineChart({
  data,
  showGlobal = true,
  showCategories = true,
}: LineChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  // Chart dimensions
  const chartWidth = screenWidth - 60; // accounting for padding
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Get data points (use global for point labels)
  const points = data.global.length > 0 ? data.global : [];
  if (points.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
        <View style={styles.emptyState} />
      </View>
    );
  }

  const getPointX = (index: number) => padding.left + (index / Math.max(1, points.length - 1)) * innerWidth;
  const getPointY = (value: number) => padding.top + innerHeight - (value / 100) * innerHeight;

  const generatePath = (dataPoints: DataPoint[]): string => {
    if (dataPoints.length === 0) return '';

    let path = '';
    for (let i = 0; i < dataPoints.length; i++) {
      const x = getPointX(i);
      const y = getPointY(dataPoints[i].value);

      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        const prevX = getPointX(i - 1);
        const prevY = getPointY(dataPoints[i - 1].value);

        // Smooth curve (quadratic Bézier)
        const controlX = (prevX + x) / 2;
        const controlY = prevY;

        path += ` Q ${controlX} ${controlY} ${x} ${y}`;
      }
    }
    return path;
  };

  const lineColors: Record<string, string> = {
    global: isDark ? '#aaaaaa' : '#666666',
    self_care: CATEGORY_COLORS.self_care.mid,
    dev_perso: CATEGORY_COLORS.dev_perso.mid,
    vie_familiale: CATEGORY_COLORS.vie_familiale.mid,
    vie_pro: CATEGORY_COLORS.vie_pro.mid,
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = getPointY(val);
          return (
            <G key={`grid-${val}`}>
              <Line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke={isDark ? '#222222' : '#eeeeee'}
                strokeWidth="1"
              />
              <SvgText
                x={padding.left - 10}
                y={y + 5}
                fontSize="10"
                fill={isDark ? '#666666' : '#aaaaaa'}
                textAnchor="end"
              >
                {val}%
              </SvgText>
            </G>
          );
        })}

        {/* Y-axis */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke={isDark ? '#333333' : '#cccccc'}
          strokeWidth="2"
        />

        {/* X-axis */}
        <Line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke={isDark ? '#333333' : '#cccccc'}
          strokeWidth="2"
        />

        {/* Global line */}
        {showGlobal && data.global.length > 0 && (
          <Path
            d={generatePath(data.global)}
            stroke={lineColors.global}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Category lines */}
        {showCategories && (
          <>
            {(Object.keys(data) as (keyof typeof data)[]).filter(
              (key) => key !== 'global'
            ).map((category) => (
              <Path
                key={`line-${category}`}
                d={generatePath(data[category as CategoryType])}
                stroke={lineColors[category] || '#000000'}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </>
        )}

        {/* Data points */}
        {points.map((point, index) => {
          const x = getPointX(index);
          const y = getPointY(point.value);
          return (
            <Circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill={isDark ? '#ffffff' : '#000000'}
              stroke={isDark ? '#1a1a1a' : '#ffffff'}
              strokeWidth="2"
            />
          );
        })}

        {/* X-axis labels */}
        {points.map((point, index) => {
          // Only show some labels to avoid crowding
          const shouldShow = points.length <= 7 || index % Math.ceil(points.length / 7) === 0;
          if (!shouldShow) return null;

          const x = getPointX(index);
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={chartHeight - padding.bottom + 20}
              fontSize="10"
              fill={isDark ? '#666666' : '#aaaaaa'}
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {showGlobal && (
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: lineColors.global },
              ]}
            />
          </View>
        )}
        {showCategories && (
          <>
            {(
              ['self_care', 'dev_perso', 'vie_familiale', 'vie_pro'] as CategoryType[]
            ).map((category) => (
              <View key={`legend-${category}`} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: lineColors[category] },
                  ]}
                />
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 8,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
