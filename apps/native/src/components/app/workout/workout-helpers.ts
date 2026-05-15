import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { WORKOUT_TYPES } from "@packages/shared/types";
import type { WorkoutStatus, WorkoutType } from "@nativesquare/agoge/schema";
import type {
  Duration,
  Step,
  Target,
  Workout as WorkoutStructure,
} from "@nativesquare/agoge";

export const EMPTY_STRUCTURE: WorkoutStructure = {
  schema_version: 1,
  discipline: "endurance",
  sport: "run",
  blocks: [],
};

export function useWorkoutTypeLabels(): Record<WorkoutType, string> {
  const { t } = useTranslation();
  return Object.fromEntries(
    WORKOUT_TYPES.map((type) => [type, t(`workout.types.${type}`)]),
  ) as Record<WorkoutType, string>;
}

/**
 * Translate an agoge WorkoutType enum value to a locale-aware label. Falls
 * back to capitalize-and-replace for values not covered by translations —
 * useful if the schema gains a new variant before the locale file is updated.
 */
export function workoutTypeLabel(t: TFunction, type: string): string {
  const key = `workout.types.${type}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Translate an agoge BlockType enum value to a locale-aware label, with the
 * same capitalize-and-replace fallback as `workoutTypeLabel`.
 */
export function blockTypeLabel(t: TFunction, type: string): string {
  const key = `workout.blockTypes.${type}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Display label for a training block: type, optionally suffixed with the
 * user-supplied focus (e.g. "Build — Threshold"). Replaces the dropped `name`
 * field — blocks are now identified by type + focus + dates.
 */
export function blockLabel(
  t: TFunction,
  block: { type: string; focus?: string },
): string {
  const type = blockTypeLabel(t, block.type);
  return block.focus ? `${type} — ${block.focus}` : type;
}

/**
 * Translate an agoge WorkoutStatus enum value (planned/completed/missed/
 * skipped) to a locale-aware label. Falls back to capitalize for safety.
 */
export function workoutStatusLabel(t: TFunction, status: string): string {
  const key = `workout.status.${status}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Today as YYYY-MM-DD in the user's local timezone. Compares against the
 * YYYY-MM-DD prefix of workout dates, which are noon-anchored UTC ISO and
 * therefore round-trip safely through string comparison.
 */
export function localTodayYmd(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Derive the effective workout status. The DB only ever stores transitions
 * the user has explicitly made (planned → completed/skipped); `missed` is
 * surfaced lazily at read time when a planned workout's date has passed
 * without an actual face. Backend rules continue to read the persisted
 * status — they treat planned/missed/skipped as equivalent "not completed".
 */
export function deriveWorkoutStatus(
  workout: {
    status: WorkoutStatus;
    planned?: { date: string } | undefined;
    actual?: { date: string } | undefined;
  },
  todayYmd: string,
): WorkoutStatus {
  if (workout.status === "completed" || workout.status === "skipped") {
    return workout.status;
  }
  if (workout.actual) return "completed";
  if (workout.planned && workout.planned.date.slice(0, 10) < todayYmd) {
    return "missed";
  }
  return "planned";
}

// ── Step intent ─────────────────────────────────────────────────────────────

export type IntentKind = Step["intent"];
export const INTENTS = [
  "warmup",
  "work",
  "recovery",
  "cooldown",
  "rest",
  "active",
] as const satisfies readonly IntentKind[];
export type IntentKindOption = (typeof INTENTS)[number];

export function useIntentLabels(): Record<IntentKindOption, string> {
  const { t } = useTranslation();
  return {
    warmup: t("workout.intents.warmup.label"),
    work: t("workout.intents.work.label"),
    recovery: t("workout.intents.recovery.label"),
    cooldown: t("workout.intents.cooldown.label"),
    rest: t("workout.intents.rest.label"),
    active: t("workout.intents.active.label"),
  };
}

export function intentLabel(t: TFunction, kind: IntentKindOption): string {
  return t(`workout.intents.${kind}.label`);
}

export const INTENT_COLORS: Record<IntentKindOption, string> = {
  warmup: "#5B9EFF",
  work: "#FF9500",
  recovery: "#4ADE80",
  cooldown: "#5B9EFF",
  rest: "#A3A3A0",
  active: "#C8FF00",
};

// Watch behavior context: https://forums.garmin.com/developer/fit-sdk/f/discussion/244073
export function useIntentDescriptions(): Record<IntentKindOption, string> {
  const { t } = useTranslation();
  return {
    warmup: t("workout.intents.warmup.description"),
    work: t("workout.intents.work.description"),
    recovery: t("workout.intents.recovery.description"),
    cooldown: t("workout.intents.cooldown.description"),
    rest: t("workout.intents.rest.description"),
    active: t("workout.intents.active.description"),
  };
}

// ── Step duration ───────────────────────────────────────────────────────────

export type DurationKind = Duration["type"];

export const ALLOWED_DURATIONS_FOR_RUN = [
  "time",
  "distance",
  "open",
] as const satisfies readonly DurationKind[];
export type DurationKindOption = (typeof ALLOWED_DURATIONS_FOR_RUN)[number];

export function useDurationLabels(): Record<DurationKindOption, string> {
  const { t } = useTranslation();
  return {
    time: t("workout.durations.time.label"),
    distance: t("workout.durations.distance.label"),
    open: t("workout.durations.open.label"),
  };
}

export function useDurationDescriptions(): Record<DurationKindOption, string> {
  const { t } = useTranslation();
  return {
    time: t("workout.durations.time.description"),
    distance: t("workout.durations.distance.description"),
    open: t("workout.durations.open.description"),
  };
}

// Returns a "blank" duration of the given kind. Time/distance use 0 as the
// "user hasn't filled this in yet" sentinel — the schema requires positive
// values, so the Step editor disables Save until the user enters a real
// number.
export function emptyDurationOf(kind: DurationKindOption): Duration {
  switch (kind) {
    case "time":
      return { type: "time", seconds: 0 };
    case "distance":
      return { type: "distance", meters: 0 };
    case "open":
      return { type: "open" };
  }
}

/**
 * Locale-aware duration formatter. Pass `t` from `useTranslation()` so the
 * verbose outputs ("open", "until HR > X") render in the active language.
 * Numeric/symbolic outputs (`5 min`, `1.2 km`, `300 kcal`) are universal.
 */
export function formatDuration(t: TFunction, d: Duration): string {
  switch (d.type) {
    case "time": {
      const m = Math.floor(d.seconds / 60);
      const s = d.seconds - m * 60;
      if (m > 0 && s === 0) return `${m} min`;
      if (m === 0) return `${s}s`;
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    case "distance":
      return d.meters >= 1000
        ? `${(d.meters / 1000).toFixed(d.meters % 1000 === 0 ? 0 : 2)} km`
        : `${d.meters} m`;
    case "calories":
      return `${d.kcal} kcal`;
    case "open":
      return t("workout.formatDuration.open");
    case "hr_gate":
      return d.comparator === "above"
        ? t("workout.formatDuration.untilHrAbove", { bpm: d.bpm })
        : t("workout.formatDuration.untilHrBelow", { bpm: d.bpm });
    case "power_gate":
      return d.comparator === "above"
        ? t("workout.formatDuration.untilPowerAbove", { watts: d.watts })
        : t("workout.formatDuration.untilPowerBelow", { watts: d.watts });
  }
}

// ── Step target ─────────────────────────────────────────────────────────────

export type TargetKind = Target["type"];
export const ALLOWED_TARGETS_FOR_RUN = [
  "none",
  "pace_range",
  "cadence_range",
  "rpe",
] as const satisfies readonly TargetKind[];
export type TargetKindOption = (typeof ALLOWED_TARGETS_FOR_RUN)[number];

export function useTargetLabels(): Record<TargetKindOption, string> {
  const { t } = useTranslation();
  return {
    none: t("workout.targets.none.label"),
    pace_range: t("workout.targets.pace_range.label"),
    cadence_range: t("workout.targets.cadence_range.label"),
    rpe: t("workout.targets.rpe.label"),
  };
}

export function useTargetDescriptions(): Record<TargetKindOption, string> {
  const { t } = useTranslation();
  return {
    none: t("workout.targets.none.description"),
    pace_range: t("workout.targets.pace_range.description"),
    cadence_range: t("workout.targets.cadence_range.description"),
    rpe: t("workout.targets.rpe.description"),
  };
}

export function emptyTargetOf(kind: TargetKindOption): Target {
  switch (kind) {
    case "none":
      return { type: "none" };
    case "pace_range":
      // 4:30/km and 5:00/km, in m/s
      return {
        type: "pace_range",
        max_speed_mps: 1000 / (4 * 60 + 30),
        min_speed_mps: 1000 / (5 * 60),
      };
    case "cadence_range":
      return { type: "cadence_range", min_spm: 170, max_spm: 180 };
    case "rpe":
      return { type: "rpe", value: 5 };
  }
}

export function formatTarget(t: Target | undefined): string | null {
  if (!t || t.type === "none") return null;
  switch (t.type) {
    case "pace_range":
      return `${mpsToPaceString(t.max_speed_mps)}–${mpsToPaceString(t.min_speed_mps)} /km`;
    case "hr_range":
      return `${t.min_bpm}–${t.max_bpm} bpm`;
    case "hr_zone":
      return `HR Z${t.zone}`;
    case "power_range":
      return `${t.min_w}–${t.max_w} W`;
    case "power_zone":
      return `Power Z${t.zone}`;
    case "cadence_range":
      return `${t.min_spm}–${t.max_spm} spm`;
    case "rpe":
      return `RPE ${t.value}`;
  }
}

// ── Pace conversions ────────────────────────────────────────────────────────

export function paceStringToMps(text: string): number | null {
  const match = text.match(/^(\d+):(\d{1,2})$/);
  if (!match) return null;
  const minutes = Number.parseInt(match[1] ?? "0", 10);
  const seconds = Number.parseInt(match[2] ?? "0", 10);
  if (seconds >= 60) return null;
  const secPerKm = minutes * 60 + seconds;
  if (secPerKm <= 0) return null;
  return 1000 / secPerKm;
}

export function mpsToPaceString(mps: number): string {
  if (!Number.isFinite(mps) || mps <= 0) return "";
  const secPerKm = 1000 / mps;
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm - minutes * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
