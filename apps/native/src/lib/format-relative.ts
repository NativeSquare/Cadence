import type { TFunction } from "i18next";

/**
 * Localized "X ago" formatter using `common.relativeShort.*` keys.
 * Returns null for invalid/missing input so callers can render fallbacks.
 */
export function formatRelativeShort(
  t: TFunction,
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("common.relativeShort.justNow");
  if (mins < 60) return t("common.relativeShort.minutes", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("common.relativeShort.hours", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("common.relativeShort.days", { count: days });
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return t("common.relativeShort.weeks", { count: weeks });
  const months = Math.floor(days / 30);
  if (months < 12) return t("common.relativeShort.months", { count: months });
  return t("common.relativeShort.years", { count: Math.floor(days / 365) });
}
