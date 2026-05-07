/**
 * Locale-aware formatting helpers.
 *
 * All callers should pass the active locale (typically from `useLanguage()`)
 * so output respects the user's chosen language. Use Intl APIs over hardcoded
 * month/day arrays — they handle plural rules, abbreviations, and accents
 * correctly across locales.
 */

import type { TFunction } from "i18next";
import type { Language } from "./i18n";

export function formatGreeting(t: TFunction, date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return t("plan.greetingMorning");
  if (hour < 18) return t("plan.greetingAfternoon");
  return t("plan.greetingEvening");
}

/** "Saturday, May 7" / "samedi 7 mai" */
export function formatLongDate(locale: Language, date: Date = new Date()): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** "Sat, May 7" / "sam. 7 mai" */
export function formatShortDate(locale: Language, date: Date = new Date()): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** "May" / "mai" */
export function formatMonthName(
  locale: Language,
  monthIndex: number,
  year: number,
): string {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(
    new Date(year, monthIndex, 1),
  );
}

/** "Mon" / "lun." — short weekday name for the given date */
export function formatDayLabelShort(locale: Language, date: Date): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
}
