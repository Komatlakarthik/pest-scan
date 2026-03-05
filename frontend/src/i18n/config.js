import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      welcome: 'Welcome',
      diagnose: 'Diagnose',
      shop: 'Shop',
      timeline: 'Timeline',
      profile: 'Profile',
      loading: 'Loading...'
    }
  },
  hi: {
    translation: {
      welcome: 'स्वागत है',
      diagnose: 'निदान',
      shop: 'दुकान',
      timeline: 'समयरेखा',
      profile: 'प्रोफ़ाइल',
      loading: 'लोड हो रहा है...'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
