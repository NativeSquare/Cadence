/**
 * Compact inline pill for reading-tool calls.
 *
 * Reading tools auto-execute, so the only feedback in chat is a tiny
 * "Coach checked X" / "Coach checking X..." indicator.
 */

import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import type { ToolCardProps } from "./types";

export function ReadingToolPill({ toolName, state }: ToolCardProps) {
  const isRunning =
    state === "input-streaming" || state === "input-available";
  const label = isRunning ? `Checking ${toolName}…` : `Checked ${toolName}`;

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
        <Text className="text-[11px] font-coach text-wMute">{label}</Text>
      </View>
    </Animated.View>
  );
}
