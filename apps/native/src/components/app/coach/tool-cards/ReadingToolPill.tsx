/**
 * Compact inline pill for reading-tool calls.
 *
 * Reading tools auto-execute, so the only feedback in chat is a tiny
 * "Coach checked X" / "Coach checking X..." indicator. The label map
 * humanizes each known tool name (e.g. `readDailySummary` → "daily summary");
 * unknown tools fall back to a generic camelCase split.
 */

import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { humanize } from "./format";
import type { ToolCardProps } from "./types";

/**
 * Tool names known to have a friendly translation under
 * `coach.tools.reading.labels.{toolName}`. Unknown tools fall back to a
 * camelCase split via `humanize()`.
 *
 * Read = retrieve a structured object the coach inspected.
 * Checked = retrieve a list/range the coach scanned.
 */
const KNOWN_TOOL_LABELS = new Set([
  // Agoge
  "getAthlete",
  "getAthletePlan",
  "listBlocks",
  "getBlock",
  "listWorkouts",
  "listWorkoutsByBlock",
  "getWorkout",
  // Soma
  "readSleep",
  "readDailySummary",
  "readNutrition",
  "readMenstruation",
  "readSomaProfile",
  "readConnections",
]);

export function ReadingToolPill({ toolName, state }: ToolCardProps) {
  const { t } = useTranslation();
  const isRunning =
    state === "input-streaming" || state === "input-available";
  const label = KNOWN_TOOL_LABELS.has(toolName)
    ? t(`coach.tools.reading.labels.${toolName}`)
    : humanize(toolName).toLowerCase();
  const text = isRunning
    ? t("coach.tools.reading.checkingFormat", { label })
    : t("coach.tools.reading.checkedFormat", { label });

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      className="flex-row justify-start"
    >
      <View className="px-2.5 py-1 rounded-full bg-w1 border border-wMute/20 flex-row items-center gap-1.5">
        <View
          className={`w-[5px] h-[5px] rounded-full ${
            isRunning ? "bg-lime" : "bg-wMute"
          }`}
        />
        <Text className="text-[11px] font-coach text-wMute">{text}</Text>
      </View>
    </Animated.View>
  );
}
