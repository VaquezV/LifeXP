import { CATEGORY_COLORS } from '@/constants/Colors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ACCESSORY_LABELS, CATEGORY_CURRENCY_NAMES } from '@/lib/category-elements-config';
import { formatPoints, formatProjectionLine, getAccessoryTierLabel } from '@/lib/accessoires';
import { ensureContrast } from '@/lib/theme-evolution';
import { CategoryType } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { AccessoryIcon } from './accessory-icon';
import { ThemedText } from './themed-text';

export interface CategoryHeaderProps {
  category: CategoryType;
  categoryLabel: string;
  categoryLevel: number;
  pointsInLevel: number;
  projectedGain?: number;
  maintenanceCost?: number;
  onManageItems: () => void;
}

export function CategoryHeader({
  category,
  categoryLabel,
  categoryLevel,
  pointsInLevel,
  projectedGain,
  maintenanceCost,
  onManageItems,
}: CategoryHeaderProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const categoryColor = CATEGORY_COLORS[category];
  const accentColor = ensureContrast(categoryColor.mid, colors.surface, 4.5);

  const currencyName = CATEGORY_CURRENCY_NAMES[category];
  const tierLabel = getAccessoryTierLabel(categoryLevel);
  const accessoryLabel = ACCESSORY_LABELS[category];
  const pointsDisplay = formatPoints(pointsInLevel, currencyName);
  const levelDisplay = `N${categoryLevel} · ${tierLabel}`;
  const projectionLine =
    projectedGain !== undefined && maintenanceCost !== undefined
      ? formatProjectionLine(category, projectedGain, maintenanceCost)
      : null;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={[styles.header, { borderLeftColor: accentColor }]}>
      <Pressable
        style={[
          styles.accessoryWrapper,
          {
            borderColor: accentColor + '4d',
            backgroundColor: accentColor + '0d',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${accessoryLabel} — ${tierLabel}`}
      >
        <AccessoryIcon
          category={category}
          level={categoryLevel}
          size={90}
        />
      </Pressable>

      <View style={styles.categoryInfo}>
        <View style={styles.titleRow}>
          <ThemedText type="subtitle" style={[styles.categoryTitle, { color: colors.text }]}>
            {categoryLabel}
          </ThemedText>
          <View style={styles.titleActions}>
            <Pressable onPress={onManageItems} style={styles.iconButton}>
              <MaterialIcons name="edit" size={18} color={accentColor} />
            </Pressable>
            {/* <Pressable onPress={onManageItems} style={styles.iconButton} accessibilityRole="button">
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialIcons name="add-circle" size={22} color={accentColor} />
              </Animated.View>
            </Pressable> */}
          </View>
        </View>

        <View style={styles.metaRow}>
          <ThemedText style={[styles.pointsText, { color: accentColor }]}>
            {pointsDisplay}
          </ThemedText>
          {/* <View style={styles.metaBadge}>
            <ThemedText style={[styles.levelText, { color: colors.textMuted }]}>
              {levelDisplay}
            </ThemedText>
          </View> */}
        </View>

        {projectionLine && (
          <ThemedText style={[styles.projectionText, { color: colors.textMuted }]}>
            {projectionLine}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 3,
    gap: 12,
  },
  accessoryWrapper: {
    width: 104,
    height: 104,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryInfo: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  projectionText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
