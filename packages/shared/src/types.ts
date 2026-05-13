import type { BlockType, WorkoutType } from "@nativesquare/agoge/schema";

export const WORKOUT_TYPES = [
    "easy",
    "threshold",
    "intervals",
    "long",
    "race",
    "race_pace",
    "recovery",
    "test",
] as const satisfies readonly WorkoutType[];

export const BLOCK_TYPES = [
    "base",
    "build",
    "peak",
    "taper",
] as const satisfies readonly BlockType[];
