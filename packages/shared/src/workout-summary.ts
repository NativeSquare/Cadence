import type {
  Repeat,
  Step,
  Workout as WorkoutStructure,
} from "@nativesquare/agoge";

export type StructureSummary = {
  distanceMeters: number;
  durationSeconds?: number;
  avgPaceMps?: number;
};

/**
 * Walk a structure tree and return total distance + distance-weighted
 * duration/pace. Duration/pace are omitted if any step lacks a pace target
 * or uses a non-distance duration (we can't aggregate cleanly).
 */
export function summarizeStructure(
  structure: WorkoutStructure,
): StructureSummary {
  let totalMeters = 0;
  let totalSeconds = 0;
  let timeKnown = true;

  const visit = (block: Step | Repeat, multiplier: number): void => {
    if (block.kind === "repeat") {
      for (const child of block.children) {
        visit(child, multiplier * block.count);
      }
      return;
    }
    if (block.duration.type !== "distance") {
      timeKnown = false;
      return;
    }
    const meters = block.duration.meters * multiplier;
    totalMeters += meters;
    if (block.target?.type === "pace_range") {
      const speed =
        (block.target.min_speed_mps + block.target.max_speed_mps) / 2;
      if (speed > 0) {
        totalSeconds += meters / speed;
        return;
      }
    }
    timeKnown = false;
  };

  for (const block of structure.blocks) visit(block, 1);

  const distanceMeters = Math.round(totalMeters);
  if (!timeKnown || totalSeconds <= 0) return { distanceMeters };
  return {
    distanceMeters,
    durationSeconds: Math.round(totalSeconds),
    avgPaceMps: Math.round((totalMeters / totalSeconds) * 100) / 100,
  };
}
