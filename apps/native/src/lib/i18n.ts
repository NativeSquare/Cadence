/**
 * i18n setup for the Cadence native app.
 *
 * - On first launch, defaults to the device locale (via expo-localization),
 *   falling back to English if the device language isn't supported.
 * - User-picked language is persisted to AsyncStorage so it survives restarts.
 * - Components read the active language with `useLanguage()` and switch with
 *   `setLanguage(next)`. Re-renders flow through react-i18next's own
 *   subscription, so callers don't need to wire anything else up.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "app.language.v1";
const FALLBACK_LANGUAGE: Language = "en";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

function isSupported(value: string | null | undefined): value is Language {
  return (
    value !== null &&
    value !== undefined &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}

function detectDeviceLanguage(): Language {
  const locales = Localization.getLocales();
  const deviceCode = locales[0]?.languageCode ?? null;
  return isSupported(deviceCode) ? deviceCode : FALLBACK_LANGUAGE;
}

let initialized = false;

export async function initI18n(): Promise<void> {
  if (initialized) return;
  initialized = true;

  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[i18n] hydrate failed", err);
  }

  const initialLanguage: Language = isSupported(stored)
    ? stored
    : detectDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: "v4",
  });
}

export function setLanguage(next: Language): void {
  if (i18n.language === next) return;
  i18n.changeLanguage(next).catch((err) => {
    console.warn("[i18n] changeLanguage failed", err);
  });
  AsyncStorage.setItem(STORAGE_KEY, next).catch((err) => {
    console.warn("[i18n] persist failed", err);
  });
}

export function useLanguage(): Language {
  const { i18n: instance } = useTranslation();
  const code = instance.language;
  return isSupported(code) ? code : FALLBACK_LANGUAGE;
}
