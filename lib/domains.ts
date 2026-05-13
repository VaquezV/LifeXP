export type ScoreValue = 0 | 1 | 2;

export type DomainPreset = {
  label: string;
  value: number;
};

export type DomainKey =
  | 'dents'
  | 'douche'
  | 'sommeil'
  | 'violon'
  | 'enfants'
  | 'chien'
  | 'femme';

export type DomainDefinition = {
  description: string;
  emoji: string;
  key: DomainKey;
  label: string;
  unitLabel: string;
  weeklyGoalCount?: number;
  weeklyMaxScore: number;
};

export type DomainValueMap = Record<DomainKey, number>;

export const DOMAINS: DomainDefinition[] = [
  {
    key: 'dents',
    emoji: '🪥',
    label: 'Dents',
    description: 'Objectif: 2 brossages par jour.',
    unitLabel: 'brossage',
    weeklyMaxScore: 14,
  },
  {
    key: 'douche',
    emoji: '🚿',
    label: 'Douche',
    description: 'Objectif: 3 douches par semaine.',
    unitLabel: 'douche',
    weeklyGoalCount: 3,
    weeklyMaxScore: 6,
  },
  {
    key: 'sommeil',
    emoji: '😴',
    label: 'Sommeil',
    description: '5h = 0%, 7h = 100%.',
    unitLabel: 'minute',
    weeklyMaxScore: 14,
  },
  {
    key: 'violon',
    emoji: '🎻',
    label: 'Violon',
    description: 'Objectif: 15 minutes par jour.',
    unitLabel: 'minute',
    weeklyMaxScore: 14,
  },
  {
    key: 'enfants',
    emoji: '🧒',
    label: 'Enfants',
    description: 'Semaine: 15 min par enfant. Week-end: 30 min.',
    unitLabel: 'minute',
    weeklyMaxScore: 14,
  },
  {
    key: 'chien',
    emoji: '🐕',
    label: 'Chien',
    description: '30 min = 0%, 1h = 100%.',
    unitLabel: 'minute',
    weeklyMaxScore: 14,
  },
  {
    key: 'femme',
    emoji: '💆',
    label: 'Femme',
    description: 'Objectif: massage des bras 3 fois par semaine.',
    unitLabel: 'massage',
    weeklyGoalCount: 3,
    weeklyMaxScore: 6,
  },
];

export const MAX_DAILY_SCORE = DOMAINS.length * 2;
export const MAX_WEEKLY_SCORE = DOMAINS.reduce((sum, domain) => sum + domain.weeklyMaxScore, 0);
export const STREAK_TARGET_SCORE = 10;

export const SCORE_OPTIONS: Array<{
  icon: string;
  label: string;
  value: ScoreValue;
}> = [
  { value: 2, label: 'Fait', icon: '✅' },
  { value: 1, label: 'Partiel', icon: '⚠️' },
  { value: 0, label: 'Raté', icon: '❌' },
];

export function createEmptyValues(): DomainValueMap {
  return {
    dents: 0,
    douche: 0,
    sommeil: 0,
    violon: 0,
    enfants: 0,
    chien: 0,
    femme: 0,
  };
}

export function getDomainDefinition(domain: DomainKey) {
  return DOMAINS.find((item) => item.key === domain) ?? DOMAINS[0];
}

export function getScorePresentation(score: ScoreValue) {
  return SCORE_OPTIONS.find((option) => option.value === score) ?? SCORE_OPTIONS[2];
}

export function getDomainPresets(domain: DomainKey): DomainPreset[] {
  switch (domain) {
    case 'dents':
      return [
        { value: 0, label: '0x' },
        { value: 1, label: '1x' },
        { value: 2, label: '2x' },
      ];
    case 'douche':
      return [
        { value: 0, label: 'Non' },
        { value: 1, label: 'Oui' },
      ];
    case 'sommeil':
      return [
        { value: 300, label: '5h' },
        { value: 360, label: '6h' },
        { value: 420, label: '7h' },
        { value: 480, label: '8h+' },
      ];
    case 'violon':
      return [
        { value: 0, label: '0m' },
        { value: 10, label: '10m' },
        { value: 15, label: '15m' },
        { value: 30, label: '30m' },
      ];
    case 'enfants':
      return [
        { value: 0, label: '0m' },
        { value: 15, label: '15m' },
        { value: 30, label: '30m' },
        { value: 45, label: '45m' },
      ];
    case 'chien':
      return [
        { value: 0, label: '0m' },
        { value: 30, label: '30m' },
        { value: 45, label: '45m' },
        { value: 60, label: '60m' },
      ];
    case 'femme':
      return [
        { value: 0, label: 'Non' },
        { value: 1, label: 'Oui' },
      ];
  }
}

function clampRatio(value: number) {
  return Math.max(0, Math.min(1, value));
}

function ratioFromTarget(value: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return clampRatio(value / target);
}

function ratioFromWindow(value: number, minimum: number, target: number) {
  if (value <= minimum) {
    return 0;
  }

  if (value >= target) {
    return 1;
  }

  return clampRatio((value - minimum) / (target - minimum));
}

export function getDomainCompletionRatio(domain: DomainKey, value: number) {
  switch (domain) {
    case 'dents':
      return ratioFromTarget(value, 2);
    case 'douche':
      return value > 0 ? 1 : 0;
    case 'sommeil':
      return ratioFromWindow(value, 300, 420);
    case 'violon':
      return ratioFromTarget(value, 15);
    case 'enfants':
      return ratioFromTarget(value, 30);
    case 'chien':
      return ratioFromWindow(value, 30, 60);
    case 'femme':
      return value > 0 ? 1 : 0;
  }
}

export function deriveScoreFromRatio(ratio: number): ScoreValue {
  if (ratio >= 1) {
    return 2;
  }

  if (ratio > 0) {
    return 1;
  }

  return 0;
}

export function getDomainScore(domain: DomainKey, value: number) {
  return deriveScoreFromRatio(getDomainCompletionRatio(domain, value));
}

export function getDomainProgressText(domain: DomainKey, value: number) {
  switch (domain) {
    case 'dents':
      return `${value}/2 brossages`;
    case 'douche':
      return value > 0 ? 'Douche faite' : 'Aucune douche';
    case 'sommeil':
      return formatMinutesAsHours(value);
    case 'violon':
      return `${value} min`;
    case 'enfants':
      return `${value} min`;
    case 'chien':
      return `${value} min`;
    case 'femme':
      return value > 0 ? 'Massage fait' : 'Aucun massage';
  }
}

export function getCompletionPercent(domain: DomainKey, value: number) {
  return Math.round(getDomainCompletionRatio(domain, value) * 100);
}

export function getFallbackValueForScore(domain: DomainKey, score: ScoreValue) {
  const presets = getDomainPresets(domain);

  if (score === 0) {
    return presets[0]?.value ?? 0;
  }

  if (score === 2) {
    return presets[presets.length - 1]?.value ?? 0;
  }

  return presets[Math.floor((presets.length - 1) / 2)]?.value ?? 0;
}

export function getWeeklyGoalDomains() {
  return DOMAINS.filter((domain) => typeof domain.weeklyGoalCount === 'number');
}

export function formatMinutesAsHours(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${`${minutes}`.padStart(2, '0')}`;
}
