import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

import { readItem, writeItem } from '@/storage';
import { en } from './en';
import { tr } from './tr';

export type Language = 'tr' | 'en';

export const LANGUAGES: Language[] = ['tr', 'en'];

const STORAGE_KEY = 'maxxing.language';

// Cihaz dili Türkçe ise Türkçe, diğer tüm dillerde İngilizce.
export function deviceLanguage(): Language {
  return getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';
}

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React zaten kaçışlıyor
  initAsync: false,
});

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
}

export function getLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : 'en';
}

// Tarih ve sayı biçimleri için (Intl).
export function getLocale(): string {
  return getLanguage() === 'tr' ? 'tr-TR' : 'en-US';
}

// Kullanıcı dili elle seçerse (ileride profil ekranından): hemen uygulanır ve hatırlanır.
export async function setLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  await writeItem(STORAGE_KEY, language);
}

// Açılışta: daha önce elle seçilmiş bir dil varsa cihaz dilinin yerine onu kullan.
export async function loadSavedLanguage(): Promise<void> {
  const saved = await readItem(STORAGE_KEY);
  if (isLanguage(saved) && saved !== i18n.language) await i18n.changeLanguage(saved);
}

export default i18n;
