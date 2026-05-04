import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import type {
  GoalRank,
  GoalStatus,
  GoalType,
} from "@nativesquare/agoge/schema";

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  performance: "Performance",
  completion: "Completion",
  process: "Process",
  volume: "Volume",
  body: "Body",
  other: "Other",
};

export const GOAL_RANK_LABELS: Record<GoalRank, string> = {
  primary: "Primary",
  stretch: "Stretch",
  minimum: "Minimum",
  process: "Process",
};

export const GOAL_RANK_COLORS: Record<GoalRank, string> = {
  primary: COLORS.lime,
  stretch: COLORS.ora,
  minimum: LIGHT_THEME.wMute,
  process: COLORS.blu,
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: "Active",
  achieved: "Achieved",
  missed: "Missed",
  abandoned: "Abandoned",
  paused: "Paused",
};

export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  active: LIGHT_THEME.wMute,
  achieved: COLORS.grn,
  missed: COLORS.red,
  abandoned: LIGHT_THEME.wMute,
  paused: COLORS.ylw,
};

export function formatGoalDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
