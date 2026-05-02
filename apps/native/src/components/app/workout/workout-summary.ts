import type {
  Step,
  Target,
  Workout as WorkoutStructure,
} from "@nativesquare/agoge";
import type { WorkoutType } from "@nativesquare/agoge/schema";
import { formatDuration, formatTarget } from "./workout-helpers";

export interface WorkoutFaceLike {
  durationSeconds?: number;
  distanceMeters?: number;
  structure?: unknown;
}

export interface WorkoutSummary {
  intent: string | null;
  volume: string | null;
  totalDistanceMeters: number | null;
  totalDurationSeconds: number | null;
}

export function summarizeWorkout(
  face: WorkoutFaceLike | undefined | null,
  type: WorkoutType,
): WorkoutSummary {
  if (type === "rest" || !face) {
    return {
      intent: null,
      volume: null,
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
    intent: pickIntent(structure, type),
    volume: formatVolume(totalDistanceMeters, totalDurationSeconds),
    totalDistanceMeters,
    totalDurationSeconds,
  };
}

function parseStructure(raw: unknown): WorkoutStructure | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<WorkoutStructure>;
  if (!Array.isArray(s.blocks) || s.blocks.length === 0) return null;
  return s as WorkoutStructure;
}

function pickIntent(
  structure: WorkoutStructure | null,
  _type: WorkoutType,
): string | null {
  if (!structure) return null;

  const repeat = structure.blocks.find((b) => b.kind === "repeat");
  if (repeat && repeat.kind === "repeat" && repeat.count > 1) {
    const work =
      repeat.children.find((s) => s.intent === "work") ?? repeat.children[0];
    if (work) return formatStepIntent(repeat.count, work);
  }

  const work = structure.blocks.find(
    (b): b is Step =>
      b.kind === "step" &&
      b.intent === "work" &&
      b.target != null &&
      b.target.type !== "none",
  );
  if (work) return formatStepIntent(1, work);

  return null;
}

function formatStepIntent(count: number, step: Step): string {
  const dur = formatDuration(step.duration);
  const target = formatStepTarget(step.target);
  const left = count > 1 ? `${count} × ${dur}` : dur;
  return target ? `${left} @ ${target}` : left;
}

function formatStepTarget(target: Target | undefined): string | null {
  const formatted = formatTarget(target);
  if (!formatted) return null;
  if (target?.type === "rpe") return formatted;
  if (target?.type === "hr_zone") return `Z${target.zone} HR`;
  return formatted;
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

function formatVolume(
  distanceM: number | null,
  durationSec: number | null,
): string | null {
  const parts: string[] = [];
  if (distanceM != null && distanceM > 0) {
    const km = Math.round((distanceM / 1000) * 10) / 10;
    parts.push(`${km} km`);
  }
  if (durationSec != null && durationSec > 0) {
    const m = Math.round(durationSec / 60);
    if (m < 60) {
      parts.push(`${m}min`);
    } else {
      const h = Math.floor(m / 60);
      const rem = m % 60;
      parts.push(rem === 0 ? `${h}h` : `${h}h${rem.toString().padStart(2, "0")}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
