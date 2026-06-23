import type { Format, GoalType } from "@/components/app/account/race-form";

export type RaceDetailsValue = {
  name: string;
  date: string;
  format: Format | "";
};

export type RaceGoalValue = {
  type: GoalType | null;
  targetHours: string;
  targetMinutes: string;
  targetSeconds: string;
};

export type PlanValue = {
  startDate: string;
};

// The kind of goal the runner is setting. Only "race" is selectable at MVP;
// "fitness" is shown as a disabled "coming soon" teaser and never set (ADR-0008).
// Grows to "race" | "fitness" when general-fitness goals actually ship.
export type GoalCategory = "race";
