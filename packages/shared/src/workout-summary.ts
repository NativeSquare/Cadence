import type {
  Repeat,
  Step,
  Target,
  Workout as WorkoutStructure,
} from "@nativesquare/agoge";

export type StructureSummary = {
  distanceMeters: number;
  durationSeconds: number;
};

/**
 * Walk a workout structure and return best-effort totals.
 *
 * Per step:
 * - time-typed: contributes seconds directly; meters derived from pace target if present
 * - distance-typed: contributes meters directly; seconds derived from pace target if present
 * - open / hr_gate / power_gate: contributes nothing (truly unknown)
 *
 * Pace conversion uses the midpoint of `pace_range` targets. Other target
 * kinds (hr_range, rpe, etc.) don't encode speed, so steps with those targets
 * only contribute their native unit.
 *
 * Both totals always returned — `0` means "no contributing steps", not "missing data".
 */
export function summarizeStructure(
  structure: WorkoutStructure,
): StructureSummary {
  let totalMeters = 0;
  let totalSeconds = 0;

  const visit = (block: Step | Repeat, multiplier: number): void => {
    if (block.kind === "repeat") {
      for (const child of block.children) {
        visit(child, multiplier * block.count);
      }
      return;
    }

    const speed = paceMidpointMps(block.target);

    if (block.duration.type === "time") {
      const seconds = block.duration.seconds * multiplier;
      totalSeconds += seconds;
      if (speed > 0) totalMeters += seconds * speed;
      return;
    }
    if (block.duration.type === "distance") {
      const meters = block.duration.meters * multiplier;
      totalMeters += meters;
      if (speed > 0) totalSeconds += meters / speed;
      return;
    }
    // open / hr_gate / power_gate contribute nothing
  };

  for (const block of structure.blocks) visit(block, 1);

  return {
    distanceMeters: Math.round(totalMeters),
    durationSeconds: Math.round(totalSeconds),
  };
}

function paceMidpointMps(target: Target | undefined): number {
  if (!target || target.type !== "pace_range") return 0;
  return (target.min_speed_mps + target.max_speed_mps) / 2;
}

/**
 * Narrow an unknown blob to a usable `WorkoutStructure`. Returns null when the
 * blob isn't an object with a non-empty `blocks` array.
 */
export function parseStructure(raw: unknown): WorkoutStructure | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<WorkoutStructure>;
  if (!Array.isArray(s.blocks) || s.blocks.length === 0) return null;
  return s as WorkoutStructure;
}
