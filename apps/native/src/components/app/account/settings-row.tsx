import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

export type SettingsRowProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value?: string;
  valueColor?: string;
  iconColor?: string;
  iconBgColor?: string;
  destructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
  onPress?: () => void;
};

/**
 * Settings Row Component
 * Reference: cadence-settings.tsx design
 *
 * Displays a single settings row with icon, label, optional value, and chevron.
 * Supports custom icon colors and backgrounds for the new design.
 */
export function SettingsRow({
  label,
  icon,
  value,
  valueColor,
  iconColor,
  iconBgColor,
  destructive,
  showChevron = true,
  isLast = false,
  onPress,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3.5 px-4 py-3.5 active:opacity-70"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
      }
    >
      <View
        className="size-[34px] items-center justify-center rounded-[10px]"
        style={{
          backgroundColor: iconBgColor || LIGHT_THEME.w3,
        }}
      >
        <Ionicons
          name={icon}
          size={16}
          color={
            iconColor ||
            (destructive ? COLORS.red : LIGHT_THEME.wSub)
          }
        />
      </View>
      <Text
        className="flex-1 font-coach-medium text-[15px]"
        style={{ color: destructive ? COLORS.red : LIGHT_THEME.wText }}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-1.5">
        {value && (
          <Text
            className={valueColor ? "font-coach-semibold text-[13px]" : "font-coach text-[13px]"}
            style={{ color: valueColor || LIGHT_THEME.wMute }}
          >
            {value}
          </Text>
        )}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={14}
            color={LIGHT_THEME.wMute}
          />
        )}
      </View>
    </Pressable>
  );
}
