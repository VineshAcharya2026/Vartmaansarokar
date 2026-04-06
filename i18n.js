import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import pa from './locales/pa.json';
import or_ from './locales/or.json';
import ur from './locales/ur.json';
import as_ from './locales/as.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
  bn: { translation: bn },
  mr: { translation: mr },
  gu: { translation: gu },
  pa: { translation: pa },
  or: { translation: or_ },
  ur: { translation: ur },
  as: { translation: as_ }
};

const detectorOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
  lookupLocalStorage: 'i18nextLng'
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'or', 'ur', 'as'],
    defaultNS: 'translation',
    detection: detectorOptions,
    interpolation: {
      escapeValue: false
    },
    returnNull: false,
    returnEmptyString: false,
    load: 'languageOnly',
    react: {
      useSuspense: false
    },
    parseMissingKeyHandler: (key) =>
      key
        .split('.')
        .pop()
        ?.replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .trim() || key
  })
  .catch((error) => {
    console.error('i18n initialization failed', error);
  });

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
  window.localStorage.setItem('i18nextLng', language);
});

i18n.on('failedLoading', (language, namespace, message) => {
  console.warn(`i18n failed loading ${language}/${namespace}:`, message);
});

i18n.on('missingKey', (_languages, _namespace, key) => {
  console.warn(`Missing translation key: ${key}`);
});

document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'en';

export default i18n;
