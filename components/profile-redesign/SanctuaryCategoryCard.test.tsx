// components/profile-redesign/SanctuaryCategoryCard.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemedText } from '@/components/themed-text';
import { SCORING_CONFIG_FALLBACK } from '@/lib/scoring-fallback';
import type { CategoryProgress } from '@/lib/types';
import { SanctuaryCategoryCard } from './SanctuaryCategoryCard';

const renderedAvatarLevels: number[] = [];

jest.mock('@/components/accessory-icon', () => ({
  AccessoryIcon: ({ level }: { level: number }) => {
    renderedAvatarLevels.push(level);
    return null;
  },
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => () => null);
jest.mock('react-native-svg', () => ({ SvgUri: () => null }));

function progress(current_level: number, points_in_level: number): CategoryProgress {
  return {
    user_id: 'u1',
    category: 'self_care',
    current_level,
    points_in_level,
    last_maintenance_date: null,
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

function allText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAllByType(ThemedText)
    .map(n => (Array.isArray(n.props.children) ? n.props.children.join('') : n.props.children))
    .join(' | ');
}

describe('SanctuaryCategoryCard', () => {
  beforeEach(() => {
    renderedAvatarLevels.length = 0;
  });

  it('niveau 0 : affiche les accessoires du niveau 1 et le seuil de 50 points', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SanctuaryCategoryCard
          category="self_care"
          categoryProgress={progress(0, 0)}
          scoringConfigs={SCORING_CONFIG_FALLBACK}
        />
      );
    });
    const text = allText(renderer);
    expect(text).toContain('Niv. 0/5');
    expect(text).toContain('Paille sèche');
    expect(text).toContain('0 / 50 points');
    expect(renderedAvatarLevels).not.toContain(0);
  });

  it('niveau 2 avec 23 points : affiche les accessoires du niveau 3 et les points manquants', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SanctuaryCategoryCard
          category="self_care"
          categoryProgress={progress(2, 23)}
          scoringConfigs={SCORING_CONFIG_FALLBACK}
        />
      );
    });
    const text = allText(renderer);
    expect(text).toContain('Niv. 2/5');
    expect(text).toContain('23 / 85');
    expect(text).toContain('Foyer de pierres');
    expect(text).toContain('20 points');
  });

  it('niveau max (5) : ne rend ni accessoires ni barre de progression', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SanctuaryCategoryCard
          category="self_care"
          categoryProgress={progress(5, 200)}
          scoringConfigs={SCORING_CONFIG_FALLBACK}
        />
      );
    });
    const text = allText(renderer);
    expect(text).not.toContain('Prochain accessoire');
    expect(text).not.toContain('points');
    expect(text).toContain('Caverne des Cristaux');
  });

  it('affiche les éléments verrouillés du niveau courant en plus des acquis', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SanctuaryCategoryCard
          category="self_care"
          categoryProgress={progress(3, 0)}
          scoringConfigs={SCORING_CONFIG_FALLBACK}
        />
      );
    });
    const labelled = renderer.root.findAllByProps({ accessibilityLabel: "Rune de l'Antre II" });
    expect(labelled.length).toBeGreaterThan(0);
  });

  it('place le dernier accessoire à débloquer en haut de la colonne', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SanctuaryCategoryCard
          category="self_care"
          categoryProgress={progress(3, 0)}
          scoringConfigs={SCORING_CONFIG_FALLBACK}
        />
      );
    });

    const text = allText(renderer);
    expect(text.indexOf("Rune de l'Antre II")).toBeLessThan(text.indexOf('Mousse'));
  });

  it('ouvre le détail de l’évolution suivante depuis le chevron', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SanctuaryCategoryCard
          category="self_care"
          categoryProgress={progress(3, 23)}
          scoringConfigs={SCORING_CONFIG_FALLBACK}
        />
      );
    });

    const button = renderer.root.findByProps({
      accessibilityLabel: "Voir la prochaine évolution de Antre",
    });
    act(() => button.props.onPress());

    const text = allText(renderer);
    expect(text).toContain('PROCHAINE ÉVOLUTION — NIV. 4');
    expect(text).toContain('Mousse');
  });
});
