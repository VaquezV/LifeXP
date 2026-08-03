import {
  ACCESSORY_ICON_FILES_BY_LABEL,
  CATEGORY_ELEMENTS_CONFIG,
  getAccessoryFileName,
  getCategoryAvatarAsset,
} from './category-elements-config';

describe('central accessory catalog', () => {
  it('groupe les dénominations de moustaches avec leurs SVG par niveau', () => {
    expect(ACCESSORY_ICON_FILES_BY_LABEL['Moustaches naissantes']).toBe('moustache-1.svg');
    expect(ACCESSORY_ICON_FILES_BY_LABEL['Moustaches allongées']).toBe('moustache-2.svg');
    expect(ACCESSORY_ICON_FILES_BY_LABEL['Moustaches ancestrales']).toBe('moustache-5.svg');
  });

  it('enrichit les éléments configurés avec leur SVG local', () => {
    const element = CATEGORY_ELEMENTS_CONFIG.dev_perso[2][0];
    expect(element.label).toBe('Moustaches allongées');
    expect(element.assetFileName).toBe('moustache-2.svg');
    expect(element.assetSource).toBeDefined();
  });

  it('conserve le fallback pour une dénomination inconnue', () => {
    expect(ACCESSORY_ICON_FILES_BY_LABEL['Accessoire inconnu']).toBeUndefined();
  });

  it('relie les nouvelles familles Meute, Cri et Totem aux SVG fournis', () => {
    expect(CATEGORY_ELEMENTS_CONFIG.vie_familiale[3][2].assetFileName).toBe('rune_meute-3.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_familiale[4][2].assetFileName).toBe('partage-4.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_familiale[5][0].assetFileName).toBe('transmission-5.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.dev_perso[5][4].assetFileName).toBe('rune_cri-5.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.dev_perso[5][3].assetFileName).toBe('cri_ancien-5.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_pro[1][0].assetFileName).toBe('pierre-1.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_pro[5][0].assetFileName).toBe('pierre-5.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_pro[2][1].assetFileName).toBe('etoile-2.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_pro[4][1].assetFileName).toBe('cristal-4.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_pro[4][2].assetFileName).toBe('etoile-4.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_pro[5][3].assetFileName).toBe('empreinte-5.svg');
    expect(CATEGORY_ELEMENTS_CONFIG.vie_pro[5][4].assetFileName).toBe('rune_territoire-5.svg');
  });

  it('relie une icône à chacun des accessoires du Sanctuaire', () => {
    const elements = Object.values(CATEGORY_ELEMENTS_CONFIG).flatMap(levels => Object.values(levels).flat());
    expect(elements).toHaveLength(60);
    expect(elements.every(element => element.assetSource !== undefined)).toBe(true);
  });

  it('résout aussi les avatars de catégories depuis le même catalogue', () => {
    expect(getCategoryAvatarAsset('self_care', 4)).toBeDefined();
  });

  it('associe les visuels aux niveaux affichés sans décalage', () => {
    expect(getAccessoryFileName('self_care', 0)).toBe('antre.0-20.svg');
    expect(getCategoryAvatarAsset('self_care', 0)).toBeUndefined();
    expect(getAccessoryFileName('self_care', 1)).toBe('antre.0-20.svg');
    expect(getAccessoryFileName('self_care', 5)).toBe('antre.81-100.svg');
  });
});
