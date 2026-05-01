import { SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import { SubSport, WorkoutType } from "@nativesquare/agoge/schema";

export const WORKOUT_TYPES = [
    "easy",
    "tempo",
    "long",
] as const satisfies readonly WorkoutType[];
export type WorkoutTypeOption = (typeof WORKOUT_TYPES)[number];

export const WORKOUT_TYPE_LABELS: Record<WorkoutTypeOption, string> = {
    easy: "Easy",
    tempo: "Tempo",
    long: "Long",
};

export const WORKOUT_TYPE_COLORS: Record<WorkoutTypeOption, string> = {
    easy: SESSION_TYPE_COLORS.easy,
    tempo: SESSION_TYPE_COLORS.specific,
    long: SESSION_TYPE_COLORS.long,
};

export const SUB_SPORTS = [
    "track",
    "trail",
    "treadmill",
    "street",
    "indoor",
    "virtual",
] as const satisfies readonly SubSport[];
export type SubSportOption = (typeof SUB_SPORTS)[number];

export const SUB_SPORT_LABELS: Record<SubSportOption, string> = {
    track: "Track",
    trail: "Trail",
    treadmill: "Treadmill",
    street: "Street",
    indoor: "Indoor",
    virtual: "Virtual",
};