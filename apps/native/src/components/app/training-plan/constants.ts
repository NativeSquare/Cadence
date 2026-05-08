import type { BlockType, WorkoutType } from "@nativesquare/agoge/schema";

export const BLOCK_TYPES = [
  "base",
  "build",
  "peak",
  "taper",
  "recovery",
  "maintenance",
  "transition",
] as const satisfies readonly BlockType[];

export const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  base: "#6B9E3A",
  build: "#E8A030",
  peak: "#E64D4D",
  taper: "#5B9EFF",
  recovery: "#8BC34A",
  maintenance: "#9E9E9E",
  transition: "#AB47BC",
};

export const WORKOUT_TYPES = [
  "easy",
  "long",
  "tempo",
  "threshold",
  "intervals",
  "vo2max",
  "fartlek",
  "progression",
  "race_pace",
  "recovery",
  "strides",
  "hills",
  "race",
  "test",
  "cross_training",
  "strength",
  "rest",
  "other",
] as const satisfies readonly WorkoutType[];

const EASY_LIKE: ReadonlySet<WorkoutType> = new Set([
  "easy",
  "recovery",
  "strides",
  "rest",
]);
const LONG_LIKE: ReadonlySet<WorkoutType> = new Set(["long"]);
const RACE_LIKE: ReadonlySet<WorkoutType> = new Set(["race"]);

export function workoutTypeColor(type: WorkoutType): string {
  if (EASY_LIKE.has(type)) return "#00E676";
  if (LONG_LIKE.has(type)) return "#00B0FF";
  if (RACE_LIKE.has(type)) return "#FF0040";
  return "#FF6D00";
}

export function workoutTypeColorDim(type: WorkoutType): string {
  if (EASY_LIKE.has(type)) return "rgba(0, 230, 118, 0.15)";
  if (LONG_LIKE.has(type)) return "rgba(0, 176, 255, 0.15)";
  if (RACE_LIKE.has(type)) return "rgba(255, 0, 64, 0.15)";
  return "rgba(255, 109, 0, 0.15)";
}
