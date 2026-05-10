import type { WorkoutType, BlockType } from "@nativesquare/agoge/schema";


export const CADENCE_WORKOUT_TYPES = [
    "easy",
    "tempo",
    "long",
    "race",
] as const satisfies readonly WorkoutType[];
export type CadenceWorkoutType = (typeof CADENCE_WORKOUT_TYPES)[number];

export const BLOCK_TYPES = [
    "base",
    "build",
    "peak",
    "taper",
    "recovery",
    "maintenance",
    "transition",
] as const satisfies readonly BlockType[];
export type CadenceBlockType = (typeof BLOCK_TYPES)[number];