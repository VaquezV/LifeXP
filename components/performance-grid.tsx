import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from './themed-text';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';

export interface PerformanceGridProps {
  data: Record<string, Record<number, number>>; // date -> { slotIndex -> percentage (0-100) }
  accentColor: string;
  cols?: number; // nombre de colonnes (défaut 29)
  rows?: number; // nombre de lignes (défaut 5)
}

export function PerformanceGrid({
  data,
  accentColor,
  cols = 29,
  rows = 5,
}: PerformanceGridProps) {
  const theme = useWolfLevelTheme();
  const screenWidth = Dimensions.get('window').width;
  const padding = 16;
  const gap = 3;
  const totalCubes = cols * rows;
  const gridWidth = screenWidth - padding * 2;
  const squareSize = Math.floor((gridWidth - gap * (cols - 1)) / cols);

  const getColorWithTransparency = (percentage: number): string => {
    // Extract RGB from hex
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Map percentage to opacity: 0% = 0.15, 100% = 1
    const opacity = 0.15 + (Math.max(0, percentage) / 100) * 0.85;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const gridData = useMemo(() => {
    const today = new Date();
    const squares = [];

    // Générer totalCubes carrés (29 × 5 = 145)
    for (let i = 0; i < totalCubes; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (totalCubes - 1 - i));
      const dateStr = date.toISOString().split('T')[0];

      const percentage = data[dateStr]?.[0] ?? 0;
      squares.push({
        id: `${dateStr}-${i}`,
        percentage,
        dateStr,
      });
    }

    return squares;
  }, [data, totalCubes]);

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.title, { color: theme.text }]}>PERFORMANCES</ThemedText>
      <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.grid, { width: gridWidth, gap }]}>
          {gridData.map((square) => (
            <View
              key={square.id}
              style={[
                styles.square,
                {
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: getColorWithTransparency(square.percentage),
                  borderColor: square.percentage === 0 ? theme.borderSoft : accentColor,
                  borderWidth: square.percentage === 0 ? 0.5 : 0,
                },
              ]}
            />
          ))}
        </View>
        <ThemedText style={[styles.legend, { color: theme.textMuted }]}>
          {totalCubes} jours ({cols}×{rows}) • Progression sur {Math.ceil(totalCubes / 7)} semaines
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  square: {
    borderRadius: 2,
  },
  legend: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
