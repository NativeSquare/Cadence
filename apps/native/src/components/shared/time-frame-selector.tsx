import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { GRAYS } from "@/lib/design-tokens";

export type TimeFrame = "7d" | "1mo" | "3mo" | "6mo" | "1yr";

const TIME_FRAME_OPTIONS: { value: TimeFrame; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "1mo", label: "1 mo" },
  { value: "3mo", label: "3 mo" },
  { value: "6mo", label: "6 mo" },
  { value: "1yr", label: "1 yr" },
];

export const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
  "7d": "Last 7 days",
  "1mo": "Last month",
  "3mo": "Last 3 months",
  "6mo": "Last 6 months",
  "1yr": "Last year",
};

interface TimeFrameSelectorProps {
  selected: TimeFrame;
  onSelect: (timeFrame: TimeFrame) => void;
}

export function TimeFrameSelector({
  selected,
  onSelect,
}: TimeFrameSelectorProps) {
  return (
    <View
      className="flex-row gap-[6px] rounded-xl p-[3px]"
      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
    >
      {TIME_FRAME_OPTIONS.map((option) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            className="flex-1 items-center"
            style={{
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: isActive
                ? GRAYS.g1
                : "transparent",
            }}
          >
            <Text
              className="text-[13px] font-coach-semibold"
              style={{
                color: isActive ? "#1A1A1A" : GRAYS.g3,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
