/**
 * Formatters shared across coach tool cards. Inputs may be either calendar
 * dates ("2026-05-01" — block/plan boundaries) or full UTC ISO instants
 * ("2026-05-01T14:30:00.000Z" — workout planned/actual dates), so the
 * parser handles both shapes.
 */

import { paceMpsToMinPerKm } from "@/lib/format-pace";

const CALENDAR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Calendar dates must be parsed as local-time Y-M-D — otherwise `new Date("2026-05-07")`
// interprets the string as UTC midnight and shifts the displayed day back by one
// in any negative-offset locale.
function parseDate(value: string): Date {
  if (CALENDAR_DATE_RE.test(value)) {
    const [y, m, d] = value.split("-").map((p) => Number.parseInt(p, 10));
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

export function formatDate(value: string): string {
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(value: string): string {
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export function formatDistance(m?: number): string | null {
  if (m == null || m <= 0) return null;
  const km = Math.round((m / 1000) * 10) / 10;
  return `${km} km`;
}

export function formatDuration(sec?: number): string | null {
  if (sec == null || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const min = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h${String(min).padStart(2, "0")}`;
  return `${min}min`;
}

export function formatPace(mps?: number): string | null {
  if (mps == null || mps <= 0) return null;
  const pace = paceMpsToMinPerKm(mps);
  return pace ? `${pace} /km` : null;
}

export function formatHr(bpm?: number): string | null {
  if (bpm == null || bpm <= 0) return null;
  return `${Math.round(bpm)} bpm`;
}

export function formatElevation(m?: number): string | null {
  if (m == null || m <= 0) return null;
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export function formatRpe(rpe?: number): string | null {
  if (rpe == null || rpe <= 0) return null;
  return `RPE ${rpe}`;
}

/** Snake_case or camelCase → "Title Case Words". */
export function humanize(name: string): string {
  const spaced = name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
