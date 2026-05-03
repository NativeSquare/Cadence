import {
  safeParseWorkout,
  type Workout as WorkoutStructure,
} from "@nativesquare/agoge";
import { z } from "zod";

export function nowIso(): string {
  return new Date().toISOString();
}

export function ymdToIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

export function isFutureYmd(ymd: string): boolean {
  const [y, m, d] = ymd.split("-").map((p) => Number.parseInt(p, 10));
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target > today;
}

export function isValidIso(s: string): boolean {
  if (!s) return false;
  const parsed = Date.parse(s);
  if (Number.isNaN(parsed)) return false;
  return new Date(parsed).toISOString() === s;
}

export const workoutFaceSchema = z.object({
  date: z.string().refine(isValidIso, "Date is required"),
  // Structure is validated separately via firstStructureError/buildErrorByPath
  // and gated by canSave. Using workoutSchemaValidated here would reject the
  // default empty structure on the non-required face and silently block submit.
  structure: z.custom<WorkoutStructure>(),
  durationSeconds: z.number().optional(),
  distanceMeters: z.number().optional(),
  load: z.number().optional(),
  avgPaceMps: z.number().optional(),
  avgHr: z.number().optional(),
  maxHr: z.number().optional(),
  elevationGainMeters: z.number().optional(),
  rpe: z.number().optional(),
  notes: z.string().optional(),
});
export type WorkoutFaceValues = z.infer<typeof workoutFaceSchema>;

export function buildErrorByPath(
  structure: WorkoutStructure | undefined,
): Record<string, string> {
  if (!structure || structure.blocks.length === 0) return {};
  const result = safeParseWorkout(structure);
  if (result.success) return {};
  const map: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (path.startsWith("blocks.") && map[path] == null) {
      map[path] = issue.message;
    }
  }
  return map;
}

export function firstStructureError(
  structure: WorkoutStructure | undefined,
): string | null {
  if (!structure || structure.blocks.length === 0) return null;
  const result = safeParseWorkout(structure);
  if (result.success) return null;
  const first = result.error.issues[0];
  if (!first) return null;
  return `${first.path.join(".") || "structure"}: ${first.message}`;
}
