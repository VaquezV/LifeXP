import { CATEGORY_COLORS } from '@/constants/theme';
import {
  getContrastRatio,
  getReadableTextColor,
  PALETTES,
} from './theme-evolution';

describe('evolutionary theme accessibility', () => {
  test.each(Object.entries(PALETTES))('level %s meets semantic contrast requirements', (_, palette) => {
    const textPairs = [
      [palette.text, palette.surface],
      [palette.textMuted, palette.surface],
      [palette.textSubtle, palette.surface],
      [palette.tint, palette.surface],
      [palette.success, palette.surface],
      [palette.warning, palette.surface],
      [palette.danger, palette.surface],
      [palette.placeholder, palette.inputBackground],
    ];
    const uiPairs = [
      [palette.icon, palette.surface],
      [palette.border, palette.surface],
      [palette.borderStrong, palette.surface],
      [palette.borderSoft, palette.surface],
      [palette.cardBorder, palette.surface],
      [palette.inputBorder, palette.inputBackground],
      [palette.tabBarBorder, palette.tabBarBackground],
    ];

    textPairs.forEach(([foreground, background]) => {
      expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    });
    uiPairs.forEach(([foreground, background]) => {
      expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(3);
    });
    expect(getContrastRatio(getReadableTextColor(palette.tint), palette.tint)).toBeGreaterThanOrEqual(4.5);
  });

  test('category fills always receive readable text', () => {
    Object.values(CATEGORY_COLORS).forEach(category => {
      expect(getContrastRatio(getReadableTextColor(category.mid), category.mid)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
