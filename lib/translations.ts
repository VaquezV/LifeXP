import { CategoryType } from './types';

export const CATEGORY_TRANSLATION_KEY: Record<CategoryType, 'selfCare' | 'personalDev' | 'familyLife' | 'professional'> = {
  self_care: 'selfCare',
  dev_perso: 'personalDev',
  vie_familiale: 'familyLife',
  vie_pro: 'professional',
};

export const translations = {
  fr: {
    // Headers
    lifeXP: 'Life XP',
    mesHabitudes: 'Mes habitudes',
    performance: 'Performance',

    // Tabs
    checkin: 'Checkin',
    dashboard: 'Performance',

    // Week/Date labels
    semaine: 'Semaine',
    mois: 'Mois',
    annee: 'Année',
    overallProgress: 'Progression globale',

    // Categories
    selfCare: 'Bien être',
    personalDev: 'Developpement Personnel',
    familyLife: 'Vie Familiale',
    professional: 'Vie Professionnelle/Scolaire',

    // Common
    today: "Aujourd'hui",
    thisWeek: 'Cette semaine',
    noData: 'Pas de données',
  },
  en: {
    // Headers
    lifeXP: 'Life XP',
    mesHabitudes: 'My Habits',
    performance: 'Performance',

    // Tabs
    checkin: 'Checkin',
    dashboard: 'Performance',

    // Week/Date labels
    semaine: 'Week',
    mois: 'Month',
    annee: 'Year',
    overallProgress: 'Overall Progress',

    // Categories
    selfCare: 'Self Care',
    personalDev: 'Personal Dev',
    familyLife: 'Family Life',
    professional: 'Professional',

    // Common
    today: 'Today',
    thisWeek: 'This Week',
    noData: 'No data',
  },
} as const;

export type LanguageKey = 'fr' | 'en';
export type TranslationKey = keyof typeof translations.fr;

export function getSystemLanguage(): LanguageKey {
  try {
    // Get device locale
    const deviceLocale = require('react-native').NativeModules.SettingsManager?.settings?.AppleLocale ||
      require('react-native').NativeModules.SettingsManager?.settings?.locale ||
      'en_US';

    const langCode = typeof deviceLocale === 'string' ? deviceLocale.split('_')[0] : 'en';
    return langCode === 'fr' ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}
