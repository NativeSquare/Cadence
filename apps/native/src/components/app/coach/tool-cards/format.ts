/**
 * Formatters shared across coach tool cards.
 *
 * Workout/block dates are canonical UTC ISO timestamps (e.g.
 * "2026-05-01T14:30:00.000Z"), so we parse with `new Date(iso)` and format
 * via the platform's locale-aware Intl.
 */

import { paceMpsToMinPerKm } from "@/lib/format-pace";

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
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
