import { Text } from "@/components/ui/text";
import { ACTIVITY_COLORS } from "@/lib/design-tokens";
import React from "react";
import { View, Pressable } from "react-native";

export type ConnectedServiceCardProps = {
  name: string;
  description: string;
  icon: string;
  color: string;
  connected: boolean;
  onPress?: () => void;
};

/**
 * Connected Service Card Component
 * Reference: cadence-full-v9.jsx ProfileTab (lines 662-675)
 *
 * Displays integration status for external services (Strava, Apple Health, Garmin).
 * - Icon with brand color background
 * - Service name and description
 * - Connection status badge (Connected = green, Connect = gray)
 */
export function ConnectedServiceCard({
  name,
  description,
  icon,
  color,
  connected,
  onPress,
}: ConnectedServiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3.5 rounded-2xl border border-wBrd bg-w1 p-4 active:opacity-90"
    >
      {/* Service Icon */}
      <View
        className="size-[38px] shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: color }}
      >
        <Text
          className="font-coach-extrabold text-w1"
          style={{ fontSize: icon === "♥" ? 16 : 14 }}
        >
          {icon}
        </Text>
      </View>

      {/* Service Info */}
      <View className="flex-1">
        <Text className="font-coach-semibold text-[15px] text-wText">
          {name}
        </Text>
        <Text className="mt-0.5 font-coach text-xs text-wMute">
          {description}
        </Text>
      </View>

      {/* Connection Status Badge */}
      <View
        className="rounded-[10px] px-3 py-1.5"
        style={{
          backgroundColor: connected
            ? "rgba(168,217,0,0.1)"
            : "rgba(0,0,0,0.04)",
        }}
      >
        <Text
          className="font-coach-semibold text-xs"
          style={{
            color: connected ? ACTIVITY_COLORS.barHigh : "#A3A3A0",
          }}
        >
          {connected ? "Connected" : "Connect"}
        </Text>
      </View>
    </Pressable>
  );
}
