import { WORKOUT_CATEGORY_COLORS } from "@/lib/design-tokens";
import type {
  Duration,
  Step,
  Target,
  Workout as WorkoutStructure,
} from "@nativesquare/agoge";
import { WorkoutType } from "@nativesquare/agoge/schema";

export const EMPTY_STRUCTURE: WorkoutStructure = {
  schema_version: 1,
  discipline: "endurance",
  sport: "run",
  blocks: [],
};

export const WORKOUT_TYPES = [
  "easy",
  "tempo",
  "long",
] as const satisfies readonly WorkoutType[];
export type WorkoutTypeOption = (typeof WORKOUT_TYPES)[number];

export const WORKOUT_TYPE_LABELS: Record<WorkoutTypeOption, string> = {
  easy: "Easy",
  tempo: "Tempo",
  long: "Long",
};

export const WORKOUT_TYPE_COLORS: Record<WorkoutTypeOption, string> = {
  easy: WORKOUT_CATEGORY_COLORS.easy,
  tempo: WORKOUT_CATEGORY_COLORS.specific,
  long: WORKOUT_CATEGORY_COLORS.long,
};

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

export const INTENT_LABELS: Record<IntentKindOption, string> = {
  warmup: "Warmup",
  work: "Work",
  recovery: "Recovery",
  cooldown: "Cooldown",
  rest: "Rest",
  active: "Active",
};

export const INTENT_COLORS: Record<IntentKindOption, string> = {
  warmup: "#5B9EFF",
  work: "#FF9500",
  recovery: "#4ADE80",
  cooldown: "#5B9EFF",
  rest: "#A3A3A0",
  active: "#C8FF00",
};

// https://forums.garmin.com/developer/fit-sdk/f/discussion/244073
export const INTENT_DESCRIPTIONS: Record<IntentKindOption, string> = {
  warmup: "Easy start. Watch labels this as warm-up.",
  work: "Main prescribed effort. Watch enforces your target.",
  recovery: "Active recovery between work efforts.",
  cooldown: "Easy finish. Watch labels this as cool-down.",
  rest: "Stop and stand still. Watch may pause tracking.",
  active: "Generic effort. Use when nothing else fits.",
};

// ── Step duration ───────────────────────────────────────────────────────────

export type DurationKind = Duration["type"];

export const ALLOWED_DURATIONS_FOR_RUN = [
  "time",
  "distance",
  "open",
  "hr_gate",
] as const satisfies readonly DurationKind[];
export type DurationKindOption = (typeof ALLOWED_DURATIONS_FOR_RUN)[number];

export const DURATION_LABELS: Record<DurationKindOption, string> = {
  time: "Time",
  distance: "Distance",
  open: "Open",
  hr_gate: "HR gate",
};

// Live helper text for the picker. The hr_gate copy doubles as a hint about
// when to use "above" vs "below" so we can keep those toggle labels terse.
export const DURATION_DESCRIPTIONS: Record<DurationKindOption, string> = {
  time: "Step ends after a fixed duration.",
  distance: "Step ends after a fixed distance.",
  open: "Step ends when you press the lap button on your watch.",
  hr_gate:
    "Step ends when HR crosses the threshold. Use 'above' for warmups, 'below' for recoveries.",
};

// Returns a "blank" duration of the given kind. Time/distance use 0 as the
// "user hasn't filled this in yet" sentinel — the schema requires positive
// values, so the Step editor disables Save until the user enters a real
// number. hr_gate keeps a sensible bpm default since the comparator chip
// is meaningful even before the value is set.
export function emptyDurationOf(kind: DurationKindOption): Duration {
  switch (kind) {
    case "time":
      return { type: "time", seconds: 0 };
    case "distance":
      return { type: "distance", meters: 0 };
    case "open":
      return { type: "open" };
    case "hr_gate":
      return { type: "hr_gate", bpm: 120, comparator: "below" };
  }
}

export function formatDuration(d: Duration): string {
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
      return "open";
    case "hr_gate":
      return `until HR ${d.comparator === "above" ? ">" : "<"} ${d.bpm}`;
    case "power_gate":
      return `until ${d.comparator === "above" ? ">" : "<"} ${d.watts}W`;
  }
}

// ── Step target ─────────────────────────────────────────────────────────────

export type TargetKind = Target["type"];
export const ALLOWED_TARGETS_FOR_RUN = [
  "none",
  "pace_range",
  "hr_range",
  "hr_zone",
  "cadence_range",
  "rpe",
] as const satisfies readonly TargetKind[];
export type TargetKindOption = (typeof ALLOWED_TARGETS_FOR_RUN)[number];

export const TARGET_LABELS: Record<TargetKindOption, string> = {
  none: "None",
  pace_range: "Pace",
  hr_range: "HR range",
  hr_zone: "HR zone",
  cadence_range: "Cadence",
  rpe: "RPE",
};

// Live helper text for the picker. Tells the athlete what each target does
// during the step (intensity guidance, NOT the end condition — that's the
// duration's job).
export const TARGET_DESCRIPTIONS: Record<TargetKindOption, string> = {
  none: "No target — just run the duration.",
  pace_range: "Hold a pace inside this window.",
  hr_range: "Keep heart rate in this range.",
  hr_zone: "Hit an HR zone, computed from your threshold.",
  cadence_range: "Step rate window — useful for form drills.",
  rpe: "Subjective effort. 1 = easy, 10 = max.",
};

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
    case "hr_range":
      return { type: "hr_range", min_bpm: 140, max_bpm: 160 };
    case "hr_zone":
      return { type: "hr_zone", zone: 3 };
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
