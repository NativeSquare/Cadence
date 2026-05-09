import type { WorkoutType } from "@nativesquare/agoge/schema";

export const WORKOUT_CATEGORIES = [
  "easy",
  "tempo",
  "long",
  "race",
] as const satisfies readonly WorkoutType[];

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

export function getWorkoutCategory(type: WorkoutType): WorkoutCategory {
  switch (type) {
    case "easy":
    case "recovery":
    case "rest":
      return "easy";
    case "long":
      return "long";
    case "race":
      return "race";
    case "tempo":
    case "threshold":
    case "intervals":
    case "vo2max":
    case "fartlek":
    case "progression":
    case "race_pace":
    case "strides":
    case "hills":
    case "test":
    case "cross_training":
    case "strength":
    case "other":
      return "tempo";
  }
}
