import { WorkoutType } from "@nativesquare/agoge/schema";
import { CadenceWorkoutType } from "./types";

export function calendarToInstant(date: string): string {
    const [y, m, d] = date.split("-").map((p) => Number.parseInt(p, 10));
    return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

export function instantToCalendar(instant: string): string {
    return instant.slice(0, 10);
}

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
