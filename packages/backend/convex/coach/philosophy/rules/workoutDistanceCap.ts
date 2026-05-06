import type { PhilosophyRule } from "../types";

const MAX_DISTANCE_M = 50_000;

type Input = {
  planned?: { distanceMeters?: number };
  actual?: { distanceMeters?: number };
};

export const workoutDistanceCap: PhilosophyRule<Input> = {
  id: "workout_distance_cap",
  description:
    "A single workout must not exceed 50 km of planned or actual distance.",
  severity: "block",
  triggers: ["workout.create", "workout.update"],
  check: (input) => {
    const d = Math.max(
      input.planned?.distanceMeters ?? 0,
      input.actual?.distanceMeters ?? 0,
    );
    if (d <= MAX_DISTANCE_M) return null;
    return {
      code: "_overridden_by_runner",
      message:
        `Workout distance ${(d / 1000).toFixed(1)} km exceeds the 50 km ` +
        `single-workout cap. Reduce distance or split into multiple sessions.`,
    };
  },
};
