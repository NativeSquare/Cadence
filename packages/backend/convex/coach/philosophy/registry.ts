import { workoutDistanceCap } from "./rules/workoutDistanceCap";
import type { PhilosophyRule, PhilosophyTrigger } from "./types";

export const ALL_RULES: PhilosophyRule[] = [
  workoutDistanceCap as PhilosophyRule,
];

export const rulesByTrigger: Record<PhilosophyTrigger, PhilosophyRule[]> =
  ALL_RULES.reduce(
    (acc, r) => {
      for (const t of r.triggers) {
        (acc[t] ??= []).push(r);
      }
      return acc;
    },
    {} as Record<PhilosophyTrigger, PhilosophyRule[]>,
  );
