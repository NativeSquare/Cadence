import { SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import type {
  Duration,
  Step,
  Target,
  Workout as WorkoutStructure,
} from "@nativesquare/agoge";
import { SubSport, WorkoutType } from "@nativesquare/agoge/schema";

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

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  easy: "Easy",
  long: "Long",
  tempo: "Tempo",
  threshold: "Threshold",
  intervals: "Intervals",
  vo2max: "VO2max",
  fartlek: "Fartlek",
  progression: "Progression",
  race_pace: "Race pace",
  recovery: "Recovery",
  strides: "Strides",
  hills: "Hills",
  race: "Race",
  test: "Test",
  cross_training: "Cross-training",
  strength: "Strength",
  rest: "Rest",
  other: "Other",
};

export const WORKOUT_TYPE_COLORS: Record<WorkoutTypeOption, string> = {
  easy: SESSION_TYPE_COLORS.easy,
  tempo: SESSION_TYPE_COLORS.specific,
  long: SESSION_TYPE_COLORS.long,
};

export const SUB_SPORTS = [
  "track",
  "trail",
  "treadmill",
  "street",
  "indoor",
  "virtual",
] as const satisfies readonly SubSport[];
export type SubSportOption = (typeof SUB_SPORTS)[number];

export const SUB_SPORT_LABELS: Record<SubSportOption, string> = {
  track: "Track",
  trail: "Trail",
  treadmill: "Treadmill",
  street: "Street",
  indoor: "Indoor",
  virtual: "Virtual",
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

export const INTENT_LABELS: Record<IntentKind, string> = {
  warmup: "Warmup",
  work: "Work",
  recovery: "Recovery",
  cooldown: "Cooldown",
  rest: "Rest",
  active: "Active",
};

export const INTENT_COLORS: Record<IntentKind, string> = {
  warmup: "#5B9EFF",
  work: "#FF9500",
  recovery: "#4ADE80",
  cooldown: "#5B9EFF",
  rest: "#A3A3A0",
  active: "#C8FF00",
};

// ── Step duration ───────────────────────────────────────────────────────────

export type DurationKind = Duration["type"];
export const DURATION_LABELS: Record<DurationKind, string> = {
  time: "Time",
  distance: "Distance",
  calories: "Calories",
  open: "Open",
  hr_gate: "HR gate",
  power_gate: "Power gate",
};

export function emptyDurationOf(kind: DurationKind): Duration {
  switch (kind) {
    case "time":
      return { type: "time", seconds: 60 };
    case "distance":
      return { type: "distance", meters: 1000 };
    case "calories":
      return { type: "calories", kcal: 100 };
    case "open":
      return { type: "open" };
    case "hr_gate":
      return { type: "hr_gate", bpm: 120, comparator: "below" };
    case "power_gate":
      return { type: "power_gate", watts: 200, comparator: "below" };
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

// Run-only for now — workoutTemplates.sport is fixed to "run".
export type TargetKind = Target["type"];
export const ALLOWED_TARGETS_FOR_RUN = [
  "none",
  "pace_range",
  "hr_range",
  "hr_zone",
  "cadence_range",
  "rpe",
] as const satisfies readonly TargetKind[];

export const TARGET_LABELS: Record<TargetKind, string> = {
  none: "None",
  pace_range: "Pace",
  hr_range: "HR range",
  hr_zone: "HR zone",
  cadence_range: "Cadence",
  rpe: "RPE",
  power_range: "Power range",
  power_zone: "Power zone",
};

export function emptyTargetOf(kind: TargetKind): Target {
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
    case "power_range":
      return { type: "power_range", min_w: 200, max_w: 250 };
    case "power_zone":
      return { type: "power_zone", zone: 3 };
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
