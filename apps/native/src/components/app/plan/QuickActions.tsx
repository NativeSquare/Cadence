/**
 * QuickActions - Two primary buttons under the home page card stack.
 *
 * - Schedule a workout → opens the schedule form prefilled with the selected
 *   day on the calendar strip.
 * - Log a workout      → opens the log form prefilled with the selected day.
 *
 * Workout-type selection (easy / specific / long / race) lives inside each
 * form, not on the home page.
 */

import { View, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

interface QuickActionsProps {
  selectedDateIso: string;
  onSchedule: (dateIso: string) => void;
  onLog: (dateIso: string) => void;
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12.5L9.5 18L20 6"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ActionButton({
  label,
  description,
  icon,
  onPress,
  variant,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  const bg = isPrimary ? LIGHT_THEME.wText : LIGHT_THEME.w1;
  const labelColor = isPrimary ? "#FFFFFF" : LIGHT_THEME.wText;
  const descColor = isPrimary
    ? "rgba(255,255,255,0.65)"
    : LIGHT_THEME.wSub;

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-2xl px-4 py-3.5 active:scale-[0.97]"
      style={{
        backgroundColor: bg,
        borderWidth: isPrimary ? 0 : 1,
        borderColor: "rgba(0,0,0,0.12)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isPrimary ? 0.18 : 0.08,
        shadowRadius: 14,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center gap-2 mb-1">
        {icon}
        <Text
          className="text-[15px] font-coach-semibold"
          style={{ color: labelColor }}
        >
          {label}
        </Text>
      </View>
      <Text
        className="text-[12px] font-coach ml-[24px]"
        style={{ color: descColor }}
      >
        {description}
      </Text>
    </Pressable>
  );
}

export function QuickActions({
  selectedDateIso,
  onSchedule,
  onLog,
}: QuickActionsProps) {
  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wMute px-1 mb-2.5 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Quick Actions
      </Text>
      <View className="flex-row gap-2.5">
        <ActionButton
          label="Schedule"
          description="Plan a workout"
          icon={<PlusIcon color="#FFFFFF" />}
          variant="primary"
          onPress={() => onSchedule(selectedDateIso)}
        />
        <ActionButton
          label="Log"
          description="Record a run"
          icon={<CheckIcon color={LIGHT_THEME.wText} />}
          variant="secondary"
          onPress={() => onLog(selectedDateIso)}
        />
      </View>
    </View>
  );
}
