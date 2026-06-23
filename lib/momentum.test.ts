import {
  applyEMA, applyDecay, applyAcceleratedDecay, determineTier,
  getOverlayHeight, getOverlayColor, getAccessoryDisplayState,
  computeUpdatedMomentum, MOMENTUM_ALPHA,
} from './momentum';

describe('applyEMA', () => {
  it('momentum=0, score=100 → 30', () => expect(applyEMA(0, 100)).toBeCloseTo(30));
  it('momentum=50, score=50 → 50 (stable)', () => expect(applyEMA(50, 50)).toBeCloseTo(50));
  it('momentum=100, score=0 → 70', () => expect(applyEMA(100, 0)).toBeCloseTo(70));
  it('custom alpha=0.5: applyEMA(0, 100, 0.5) → 50', () => expect(applyEMA(0, 100, 0.5)).toBeCloseTo(50));
});

describe('applyDecay', () => {
  it('0 days → no change', () => expect(applyDecay(60, 0)).toBeCloseTo(60));
  it('1 day → multiply by 0.7', () => expect(applyDecay(100, 1)).toBeCloseTo(70));
  it('3 days → multiply by 0.7^3 ≈ 0.343', () => expect(applyDecay(100, 3)).toBeCloseTo(34.3, 0));
});

describe('applyAcceleratedDecay', () => {
  it('0 days → no change', () => expect(applyAcceleratedDecay(60, 0)).toBeCloseTo(60));
  it('1 day: (1-0.6)^1 = 0.4 → result=40', () => expect(applyAcceleratedDecay(100, 1)).toBeCloseTo(40));
  it('result clamped to 0', () => expect(applyAcceleratedDecay(100, 50)).toBeGreaterThanOrEqual(0));
});

describe('determineTier', () => {
  it('0 → 0', () => expect(determineTier(0)).toBe(0));
  it('20 → 0', () => expect(determineTier(20)).toBe(0));
  it('21 → 1', () => expect(determineTier(21)).toBe(1));
  it('40 → 1', () => expect(determineTier(40)).toBe(1));
  it('41 → 2', () => expect(determineTier(41)).toBe(2));
  it('60 → 2', () => expect(determineTier(60)).toBe(2));
  it('61 → 3', () => expect(determineTier(61)).toBe(3));
  it('80 → 3', () => expect(determineTier(80)).toBe(3));
  it('81 → 4', () => expect(determineTier(81)).toBe(4));
  it('100 → 4', () => expect(determineTier(100)).toBe(4));
});

describe('getOverlayHeight', () => {
  it('momentum=0   → 100', () => expect(getOverlayHeight(0)).toBe(100));
  it('momentum=50  → 50',  () => expect(getOverlayHeight(50)).toBe(50));
  it('momentum=100 → 0',   () => expect(getOverlayHeight(100)).toBe(0));
  it('momentum=75  → 25',  () => expect(getOverlayHeight(75)).toBe(25));
});

describe('getOverlayColor', () => {
  const GREY = 'rgba(128, 128, 128, 0.6)';
  const RED  = 'rgba(255, 0, 0, 0.6)';
  it('stable → grey',                              () => expect(getOverlayColor(50, 'stable')).toBe(GREY));
  it('up → grey',                                  () => expect(getOverlayColor(50, 'up')).toBe(GREY));
  it('down + score=22 (<25) → red',                () => expect(getOverlayColor(22, 'down')).toBe(RED));
  it('down + score=24 (<25) → red',                () => expect(getOverlayColor(24, 'down')).toBe(RED));
  it('down + score=25 (==25) → grey',              () => expect(getOverlayColor(25, 'down')).toBe(GREY));
  it('down + score=55 (≥25) → grey',               () => expect(getOverlayColor(55, 'down')).toBe(GREY));
  it('down + score=0 → red',                       () => expect(getOverlayColor(0, 'down')).toBe(RED));
});

describe('computeUpdatedMomentum', () => {
  it('first day: previous=0, score=80 → momentum≈24', () => {
    const { momentum } = computeUpdatedMomentum(0, 80, 0);
    expect(momentum).toBeCloseTo(24, 0);
  });
  it('stable: previous=50, score=50 → trend=stable', () => {
    const { trend } = computeUpdatedMomentum(50, 50, 0);
    expect(trend).toBe('stable');
  });
  it('improving: previous=20, score=100 → trend=up', () => {
    const { trend } = computeUpdatedMomentum(20, 100, 0);
    expect(trend).toBe('up');
  });
  it('declining: previous=80, score=0 → trend=down', () => {
    const { trend } = computeUpdatedMomentum(80, 0, 0);
    expect(trend).toBe('down');
  });
  it('3 days absent, score=0 → momentum < 25', () => {
    const { momentum } = computeUpdatedMomentum(60, 0, 3);
    expect(momentum).toBeLessThan(25);
    expect(momentum).toBeGreaterThanOrEqual(0);
  });
  it('result clamped [0, 100]', () => {
    expect(computeUpdatedMomentum(0, 0, 100).momentum).toBeGreaterThanOrEqual(0);
    expect(computeUpdatedMomentum(100, 100, 0).momentum).toBeLessThanOrEqual(100);
  });
  it('>3 jours sans activité et score=0 → décroissance accélérée (plus rapide que decay normal)', () => {
    // 5 jours absent avec score=0: 3 jours normal + 2 jours accélérés
    const { momentum: accelerated } = computeUpdatedMomentum(60, 0, 5);
    const { momentum: normal }      = computeUpdatedMomentum(60, 0, 3);
    // La décroissance accélérée doit être plus forte
    expect(accelerated).toBeLessThan(normal);
  });
});

describe('getAccessoryDisplayState', () => {
  it('self_care score=10, stable → tier=0, montre tier suivant antre.21-40.svg, overlay=90, grey', () => {
    const s = getAccessoryDisplayState('self_care', 10, 'stable');
    expect(s.tier).toBe(0);
    expect(s.svgFileName).toBe('antre.21-40.svg');
    expect(s.overlayHeight).toBe(90);
    expect(s.overlayColor).toBe('rgba(128, 128, 128, 0.6)');
  });
  it('self_care score=25, stable → tier=1, montre tier suivant antre.41-60.svg (exemple utilisateur)', () => {
    const s = getAccessoryDisplayState('self_care', 25, 'stable');
    expect(s.tier).toBe(1);
    expect(s.svgFileName).toBe('antre.41-60.svg');
    expect(s.overlayHeight).toBe(75);
  });
  it('dev_perso score=100, up → tier=4, reste sur cri.81-100.svg (palier max), overlay=0', () => {
    const s = getAccessoryDisplayState('dev_perso', 100, 'up');
    expect(s.tier).toBe(4);
    expect(s.svgFileName).toBe('cri.81-100.svg');
    expect(s.overlayHeight).toBe(0);
  });
  it('vie_familiale score=50, stable → tier=2, montre tier suivant meute.61-80.svg', () => {
    const s = getAccessoryDisplayState('vie_familiale', 50, 'stable');
    expect(s.tier).toBe(2);
    expect(s.svgFileName).toBe('meute.61-80.svg');
  });
  it('vie_pro score=20, down → red overlay (20 < 25)', () => {
    const s = getAccessoryDisplayState('vie_pro', 20, 'down');
    expect(s.overlayColor).toBe('rgba(255, 0, 0, 0.6)');
  });
  it('vie_pro score=30, down → grey overlay (30 ≥ 25)', () => {
    const s = getAccessoryDisplayState('vie_pro', 30, 'down');
    expect(s.overlayColor).toBe('rgba(128, 128, 128, 0.6)');
  });
  it('clamps score > 100', () => {
    const s = getAccessoryDisplayState('self_care', 150, 'stable');
    expect(s.tier).toBe(4);
    expect(s.overlayHeight).toBe(0);
  });
  it('clamps score < 0', () => {
    const s = getAccessoryDisplayState('self_care', -10, 'stable');
    expect(s.tier).toBe(0);
    expect(s.overlayHeight).toBe(100);
  });
});
