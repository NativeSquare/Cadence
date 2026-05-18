import type { ComponentType, ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { TimeWindowPill } from "./TimeWindowPill";
import { ChartLockedOverlay } from "./ChartLockedOverlay";
import type { WeekWindow } from "../lib/window";
import type { DataTypeKey } from "@/lib/providers/capabilities";

type IconCmp = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type Props = {
  title: string;
  subtitle?: string;
  Icon: IconCmp;
  // Optional: cards that don't need a time-window dropdown (e.g. a phase
  // indicator) can omit these and the pill won't render.
  window?: WeekWindow;
  windows?: WeekWindow[];
  onWindowChange?: (next: WeekWindow) => void;
  // When set, the chart body is covered by an opaque overlay announcing
  // that no connected provider tracks this data type. Title stays visible.
  lockedDataType?: DataTypeKey;
  children: ReactNode;
};

export function CardShell({
  title,
  subtitle,
  Icon,
  window,
  windows,
  onWindowChange,
  lockedDataType,
  children,
}: Props) {
  const showPill =
    window !== undefined && windows !== undefined && onWindowChange !== undefined;
  return (
    <View
      className="bg-w1 rounded-2xl p-5"
      style={{
        borderWidth: 1,
        borderColor: LIGHT_THEME.wBrd,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View className="flex-row items-start justify-between gap-3 mb-4">
        <View className="flex-row items-start gap-2.5 flex-1 min-w-0">
          <View className="w-8 h-8 rounded-lg bg-w3 items-center justify-center mt-[1px]">
            <Icon size={17} color={LIGHT_THEME.wSub} strokeWidth={2} />
          </View>
          <View className="flex-1 min-w-0">
            <Text
              className="text-[15px] font-coach-semibold text-wText"
              numberOfLines={2}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                className="text-[12px] font-coach text-wMute mt-0.5"
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {showPill ? (
          <TimeWindowPill
            value={window}
            options={windows}
            onChange={onWindowChange}
          />
        ) : null}
      </View>

      <View className="relative">
        {children}
        {lockedDataType ? <ChartLockedOverlay dataType={lockedDataType} /> : null}
      </View>
    </View>
  );
}
