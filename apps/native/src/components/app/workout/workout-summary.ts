import type {
  Step,
  Workout as WorkoutStructure,
} from "@nativesquare/agoge";
import type { WorkoutType } from "@nativesquare/agoge/schema";

export interface WorkoutFaceLike {
  durationSeconds?: number;
  distanceMeters?: number;
  structure?: unknown;
}

export interface WorkoutSummary {
  structure: WorkoutStructure | null;
  totalDistanceMeters: number | null;
  totalDurationSeconds: number | null;
}

export function summarizeWorkout(
  face: WorkoutFaceLike | undefined | null,
  type: WorkoutType,
): WorkoutSummary {
  if (type === "rest" || !face) {
    return {
      structure: null,
      totalDistanceMeters: null,
      totalDurationSeconds: null,
    };
  }

  const structure = parseStructure(face.structure);
  const totalDistanceMeters =
    face.distanceMeters ?? (structure ? sumDistanceMeters(structure) : null);
  const totalDurationSeconds =
    face.durationSeconds ?? (structure ? sumDurationSeconds(structure) : null);

  return {
    structure,
    totalDistanceMeters,
    totalDurationSeconds,
  };
}

export function parseStructure(raw: unknown): WorkoutStructure | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<WorkoutStructure>;
  if (!Array.isArray(s.blocks) || s.blocks.length === 0) return null;
  return s as WorkoutStructure;
}

function sumDistanceMeters(structure: WorkoutStructure): number | null {
  let total = 0;
  let any = false;
  for (const block of structure.blocks) {
    if (block.kind === "step") {
      const m = stepDistance(block);
      if (m != null) {
        total += m;
        any = true;
      }
      continue;
    }
    let childSum = 0;
    let childAny = false;
    for (const child of block.children) {
      const m = stepDistance(child);
      if (m != null) {
        childSum += m;
        childAny = true;
      }
    }
    if (childAny) {
      total += block.count * childSum;
      any = true;
    }
  }
  return any ? total : null;
}

function stepDistance(step: Step): number | null {
  return step.duration.type === "distance" ? step.duration.meters : null;
}

function sumDurationSeconds(structure: WorkoutStructure): number | null {
  let total = 0;
  let any = false;
  for (const block of structure.blocks) {
    if (block.kind === "step") {
      const sec = stepDurationSeconds(block);
      if (sec != null) {
        total += sec;
        any = true;
      }
      continue;
    }
    let childSum = 0;
    let childAny = false;
    for (const child of block.children) {
      const sec = stepDurationSeconds(child);
      if (sec != null) {
        childSum += sec;
        childAny = true;
      }
    }
    if (childAny) {
      total += block.count * childSum;
      any = true;
    }
  }
  return any ? total : null;
}

function stepDurationSeconds(step: Step): number | null {
  return step.duration.type === "time" ? step.duration.seconds : null;
}
