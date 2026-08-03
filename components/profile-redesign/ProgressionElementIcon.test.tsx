// components/profile-redesign/ProgressionElementIcon.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { ProgressionElementIcon } from './ProgressionElementIcon';
import { CATEGORY_ELEMENTS_CONFIG } from '@/lib/category-elements-config';
import type { ProgressionElement } from '@/lib/types';

jest.mock('react-native-svg', () => ({ SvgUri: 'SvgUri' }));

const baseElement: ProgressionElement = {
  id: 'vie_pro-l1-1',
  label: 'Galet',
  alt: 'Galet',
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
    const labelled = renderer!.root.findAllByProps({ accessibilityLabel: 'Galet' });
    expect(labelled.length).toBeGreaterThan(0);
  });

  it('affiche une image quand assetPath est renseigné', () => {
    const withAsset = { ...baseElement, assetPath: 'https://example.com/galet.png' };
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ProgressionElementIcon element={withAsset} state="unlocked" accentColor="#2e7d32" mutedColor="#ccc" />
      );
    });
    const images = renderer!.root.findAllByType(Image);
    expect(images).toHaveLength(1);
    expect(images[0].props.accessibilityLabel).toBe('Galet');
  });

  it('affiche le SVG local configuré pour un accessoire connu', () => {
    const mappedElement = CATEGORY_ELEMENTS_CONFIG.dev_perso[2][0];
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ProgressionElementIcon element={mappedElement} state="unlocked" accentColor="#2e7d32" mutedColor="#ccc" />
      );
    });
    expect(renderer!.root.findAllByType(SvgUri)).toHaveLength(1);
  });

  it('un élément verrouillé reste rendu (estompé) et garde son accessibilityLabel', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ProgressionElementIcon element={baseElement} state="locked" accentColor="#2e7d32" mutedColor="#ccc" />
      );
    });
    const labelled = renderer!.root.findAllByProps({ accessibilityLabel: 'Galet' });
    expect(labelled.length).toBeGreaterThan(0);
  });
});
