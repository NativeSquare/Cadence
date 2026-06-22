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
