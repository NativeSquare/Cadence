import { WorkoutType } from "@nativesquare/agoge/schema";
import { CadenceWorkoutType } from "./types";

export function getCadenceWorkoutType(type: WorkoutType): CadenceWorkoutType {
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
