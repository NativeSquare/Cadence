import type { Format, GoalType } from "@/components/app/account/race-form";

export type GoalBranch = "race" | "fitness";

export type FitnessGoal =
  | "start_running"
  | "restart_running"
  | "build_base"
  | "maintain_fitness";

export const FITNESS_GOALS = [
  "start_running",
  "build_base",
  "maintain_fitness",
  "restart_running",
] as const satisfies readonly FitnessGoal[];

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
