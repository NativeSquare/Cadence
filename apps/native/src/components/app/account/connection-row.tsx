import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { Pressable, View } from "react-native";

export type ConnectionRowProps = {
  name: string;
  description: string;
  icon: string;
  color: string;
  connected: boolean;
  isLast?: boolean;
  onToggle?: () => void;
};

/**
 * Connection Row Component
 * Reference: cadence-settings.tsx Connections section
 *
 * Displays an integration service row with icon, name, description, and toggle switch.
 * Used for Strava, Apple Health, Garmin connections.
 */
export function ConnectionRow({
  name,
  description,
  icon,
  color,
  connected,
  isLast = false,
  onToggle,
}: ConnectionRowProps) {
  return (
    <View
      className="flex-row items-center gap-3.5 px-4 py-3.5"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
      }
    >
      <View
        className="size-[34px] shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: color + "18" }}
      >
        <Text
          className="font-coach-extrabold"
          style={{
            fontSize: icon === "♥" ? 15 : 13,
            color: color,
          }}
        >
          {icon}
        </Text>
      </View>

      <View className="flex-1">
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {name}
        </Text>
        <Text
          className="mt-0.5 font-coach text-xs"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {description}
        </Text>
      </View>

      <Pressable
        onPress={onToggle}
        className="h-[26px] w-[44px] justify-center rounded-full p-0.5"
        style={{
          backgroundColor: connected ? COLORS.lime : "rgba(0,0,0,0.08)",
        }}
      >
        <View
          className="size-[22px] rounded-full shadow-sm"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            transform: [{ translateX: connected ? 18 : 0 }],
          }}
        />
      </Pressable>
    </View>
  );
}
