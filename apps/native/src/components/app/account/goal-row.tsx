import {
  formatGoalDate,
  GOAL_RANK_COLORS,
  GOAL_RANK_LABELS,
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
  GOAL_TYPE_LABELS,
} from "@/components/app/account/goal-display";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import type {
  GoalRank,
  GoalStatus,
  GoalType,
} from "@nativesquare/agoge/schema";
import { Pressable, View } from "react-native";

export type GoalRowDoc = {
  _id: string;
  type: GoalType;
  title: string;
  description?: string;
  targetValue: string;
  targetDate?: string;
  rank?: GoalRank;
  status: GoalStatus;
  raceId?: string;
};

export function GoalRow({
  goal,
  raceName,
  dimmed,
  isLast,
  onPress,
}: {
  goal: GoalRowDoc;
  raceName?: string;
  dimmed?: boolean;
  isLast?: boolean;
  onPress: () => void;
}) {
  const rankColor = goal.rank ? GOAL_RANK_COLORS[goal.rank] : LIGHT_THEME.w3;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-3 px-4 py-3 active:opacity-70"
      style={{
        opacity: dimmed ? 0.65 : 1,
        ...(isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }),
      }}
    >
      <View
        className="mt-1.5 size-2.5 rounded-full"
        style={{ backgroundColor: rankColor }}
      />
      <View className="flex-1 gap-0.5">
        <Text
          className="font-coach-semibold text-[10px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {GOAL_TYPE_LABELS[goal.type]}
          {goal.rank ? ` · ${GOAL_RANK_LABELS[goal.rank]}` : ""}
        </Text>
        <Text
          className="font-coach-bold text-[14px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {goal.title}
        </Text>
        {goal.targetDate && (
          <Text
            className="font-coach text-[11px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            by {formatGoalDate(goal.targetDate)}
          </Text>
        )}
        <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
          {raceName && (
            <View
              className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <Ionicons name="flag-outline" size={10} color={LIGHT_THEME.wSub} />
              <Text
                className="font-coach-semibold text-[10px]"
                style={{ color: LIGHT_THEME.wSub }}
                numberOfLines={1}
              >
                {raceName}
              </Text>
            </View>
          )}
          {goal.status !== "active" && (
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <Text
                className="font-coach-semibold text-[10px]"
                style={{ color: GOAL_STATUS_COLORS[goal.status] }}
              >
                {GOAL_STATUS_LABELS[goal.status]}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text
        className="max-w-[40%] text-right font-coach-extrabold text-[14px]"
        style={{ color: LIGHT_THEME.wText }}
        numberOfLines={2}
      >
        {goal.targetValue}
      </Text>
    </Pressable>
  );
}
