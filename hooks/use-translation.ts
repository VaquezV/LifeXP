import { useState, useEffect } from 'react';
import { translations, getSystemLanguage, LanguageKey, TranslationKey } from '@/lib/translations';

export function useTranslation() {
  const [language, setLanguage] = useState<LanguageKey>('en');

  useEffect(() => {
    const lang = getSystemLanguage();
    setLanguage(lang);
  }, []);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key];
  };

  return { t, language };
}
