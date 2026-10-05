import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import ar from './locales/ar/translation.json';
import bn from './locales/bn/translation.json';
import fr from './locales/fr/translation.json';
import hi from './locales/hi/translation.json';
import zh from './locales/zh/translation.json';
import pt from './locales/pt/translation.json';
import ru from './locales/ru/translation.json';
import es from './locales/es/translation.json';
import ur from './locales/ur/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      bn: { translation: bn },
      fr: { translation: fr },
      hi: { translation: hi },
      zh: { translation: zh },
      pt: { translation: pt },
      ru: { translation: ru },
      es: { translation: es },
      ur: { translation: ur }
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
