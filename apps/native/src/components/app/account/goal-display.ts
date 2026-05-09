import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import type {
  GoalRank,
  GoalStatus,
  GoalType,
} from "@nativesquare/agoge/schema";
import { useTranslation } from "react-i18next";

/**
 * Static English fallbacks. Prefer the hooks below for any new UI.
 * Kept exported for components in slices that haven't migrated yet.
 */
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

export function useGoalTypeLabels(): Record<GoalType, string> {
  const { t } = useTranslation();
  return {
    performance: t("account.goals.types.performance"),
    completion: t("account.goals.types.completion"),
    process: t("account.goals.types.process"),
    volume: t("account.goals.types.volume"),
    body: t("account.goals.types.body"),
    other: t("account.goals.types.other"),
  };
}

export function useGoalRankLabels(): Record<GoalRank, string> {
  const { t } = useTranslation();
  return {
    primary: t("account.goals.ranks.primary"),
    stretch: t("account.goals.ranks.stretch"),
    minimum: t("account.goals.ranks.minimum"),
    process: t("account.goals.ranks.process"),
  };
}

export function useGoalStatusLabels(): Record<GoalStatus, string> {
  const { t } = useTranslation();
  return {
    active: t("account.goals.statuses.active"),
    achieved: t("account.goals.statuses.achieved"),
    missed: t("account.goals.statuses.missed"),
    abandoned: t("account.goals.statuses.abandoned"),
    paused: t("account.goals.statuses.paused"),
  };
}

export const GOAL_RANK_COLORS: Record<GoalRank, string> = {
  primary: COLORS.lime,
  stretch: LIGHT_THEME.w3,
  minimum: LIGHT_THEME.w3,
  process: LIGHT_THEME.w3,
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
