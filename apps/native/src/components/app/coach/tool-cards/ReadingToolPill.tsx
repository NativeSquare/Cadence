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
import { Text } from "@/components/ui/text";
import { humanize } from "./format";
import type { ToolCardProps } from "./types";

/**
 * Friendly verbs for the resolved-state pill: "Checked sleep", "Read plan".
 * Read = retrieve a structured object the coach inspected.
 * Checked = retrieve a list/range the coach scanned.
 */
const TOOL_LABELS: Record<string, string> = {
  // Agoge
  getAthlete: "athlete profile",
  getAthletePlan: "training plan",
  listBlocks: "training blocks",
  getBlock: "block details",
  listWorkouts: "workouts",
  listWorkoutsByBlock: "block workouts",
  getWorkout: "workout details",
  // Soma
  readSleep: "sleep",
  readDailySummary: "daily metrics",
  readNutrition: "nutrition",
  readMenstruation: "cycle",
  readSomaProfile: "device profile",
  readConnections: "data connections",
};

function labelFor(toolName: string): string {
  return TOOL_LABELS[toolName] ?? humanize(toolName).toLowerCase();
}

export function ReadingToolPill({ toolName, state }: ToolCardProps) {
  const isRunning =
    state === "input-streaming" || state === "input-available";
  const label = labelFor(toolName);
  const text = isRunning ? `Checking ${label}…` : `Checked ${label}`;

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
