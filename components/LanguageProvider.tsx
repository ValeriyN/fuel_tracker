'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Language, LANG_COOKIE, DEFAULT_LANG, getT, TranslationKey } from '@/lib/i18n';

interface LangContextValue {
  lang: Language;
  t: (key: TranslationKey) => string;
  setLang: (lang: Language) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: DEFAULT_LANG,
  t: getT(DEFAULT_LANG),
  setLang: () => {},
});

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Language;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    document.cookie = `${LANG_COOKIE}=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }, []);

  return (
    <LangContext.Provider value={{ lang, t: getT(lang), setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LangContext);
}
