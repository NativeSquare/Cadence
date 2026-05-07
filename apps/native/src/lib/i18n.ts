/**
 * i18n setup for the Cadence native app.
 *
 * Boot-time language is the device locale (via expo-localization). Once the
 * user is authenticated, `users.locale` from Convex becomes the source of
 * truth — see the sync effect in `_layout.tsx`.
 */

import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

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

  await i18n.use(initReactI18next).init({
    resources,
    lng: detectDeviceLanguage(),
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
}

export function useLanguage(): Language {
  const { i18n: instance } = useTranslation();
  const code = instance.language;
  return isSupported(code) ? code : FALLBACK_LANGUAGE;
}
