// components/profile-redesign/SanctuaryCategoryCard.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemedText } from '@/components/themed-text';
import { SCORING_CONFIG_FALLBACK } from '@/lib/scoring-fallback';
import type { CategoryProgress } from '@/lib/types';
import { SanctuaryCategoryCard } from './SanctuaryCategoryCard';

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
  it('niveau 3 avec 23 points : affiche le niveau, les points, le prochain élément et les points manquants', () => {
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
    const text = allText(renderer);
    expect(text).toContain('Niv. 3/5');
    expect(text).toContain('23 / 85');
    expect(text).toContain('Foyer de pierres');
    expect(text).toContain('20 points');
  });

  it('niveau max (5) : pas de bloc "prochain élément" ni "niveau suivant", barre à 100%', () => {
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
    expect(text).not.toContain('Prochain');
    expect(text).not.toContain('Niveau suivant');
    expect(text).toContain('140 / 140');
  });

  it('affiche les éléments verrouillés du niveau courant en plus des acquis', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SanctuaryCategoryCard
          category="self_care"
          categoryProgress={progress(4, 0)}
          scoringConfigs={SCORING_CONFIG_FALLBACK}
        />
      );
    });
    const labelled = renderer.root.findAllByProps({ accessibilityLabel: "Rune de l'Antre II" });
    expect(labelled.length).toBeGreaterThan(0);
  });
});
