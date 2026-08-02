// components/profile-redesign/ProgressionElementIcon.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Image } from 'react-native';
import { ProgressionElementIcon } from './ProgressionElementIcon';
import type { ProgressionElement } from '@/lib/types';

const baseElement: ProgressionElement = {
  id: 'self_care-l2-1',
  label: 'Herbes coupées',
  alt: 'Herbes coupées',
  order: 1,
};

describe('ProgressionElementIcon', () => {
  it('affiche un placeholder textuel accessible quand assetPath est absent', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ProgressionElementIcon element={baseElement} state="unlocked" accentColor="#2e7d32" mutedColor="#ccc" />
      );
    });
    const images = renderer!.root.findAllByType(Image);
    expect(images).toHaveLength(0);
    const labelled = renderer!.root.findAllByProps({ accessibilityLabel: 'Herbes coupées' });
    expect(labelled.length).toBeGreaterThan(0);
  });

  it('affiche une image quand assetPath est renseigné', () => {
    const withAsset = { ...baseElement, assetPath: 'https://example.com/herbes.png' };
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ProgressionElementIcon element={withAsset} state="unlocked" accentColor="#2e7d32" mutedColor="#ccc" />
      );
    });
    const images = renderer!.root.findAllByType(Image);
    expect(images).toHaveLength(1);
    expect(images[0].props.accessibilityLabel).toBe('Herbes coupées');
  });

  it('un élément verrouillé reste rendu (estompé) et garde son accessibilityLabel', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ProgressionElementIcon element={baseElement} state="locked" accentColor="#2e7d32" mutedColor="#ccc" />
      );
    });
    const labelled = renderer!.root.findAllByProps({ accessibilityLabel: 'Herbes coupées' });
    expect(labelled.length).toBeGreaterThan(0);
  });
});
