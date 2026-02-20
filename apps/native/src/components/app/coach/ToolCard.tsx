/**
 * ToolCard - Styled card for tool call results
 * Reference: cadence-full-v9.jsx ToolCard (lines 263-286)
 *
 * Design specifications from prototype:
 * - Container: borderRadius:18, border:"1.5px solid "+T.lime, bg:T.w1
 * - Title bar: bg:T.lime, padding:"10px 16px"
 * - Icon box: width:22, height:22, borderRadius:7, bg:"rgba(0,0,0,.1)"
 * - Title text: fontSize:13, fontWeight:700, color:T.black
 * - Data labels: fontSize:11, color:T.wMute
 * - Data values: fontSize:20, fontWeight:700
 * - Note box: padding:"8px 12px", borderRadius:10, bg:"rgba(255,149,0,.08)"
 * - Note text: fontSize:12, fontWeight:500, color:T.ora
 *
 * Source: Story 10.3 - AC#2, Task 4
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeIn } from "react-native-reanimated";
import { Clock } from "lucide-react-native";

import type { ToolCardProps } from "./types";

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Data metric display
 * Reference: prototype lines 275-279
 */
interface MetricProps {
  label: string;
  value: number | string;
  isWarning?: boolean;
}

function Metric({ label, value, isWarning }: MetricProps) {
  return (
    <View className="items-start">
      {/* Label - 11px, muted */}
      <Text className="text-[11px] font-coach text-wMute">{label}</Text>
      {/* Value - 20px, bold, warning color for ratio */}
      <Text
        className={`text-[20px] font-coach-bold ${
          isWarning ? "text-ora" : "text-wText"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ToolCard component
 *
 * Renders a styled card for tool call results like Training Load.
 * Matches the prototype design with lime border and title bar.
 */
export function ToolCard({ title, data }: ToolCardProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="my-1.5 mb-3"
    >
      <View
        className="overflow-hidden bg-w1"
        style={{
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: "#C8FF00", // lime
        }}
      >
        {/* Title bar - lime background */}
        <View className="bg-lime px-4 py-2.5 flex-row items-center gap-2">
          {/* Icon container */}
          <View
            className="w-[22px] h-[22px] rounded-[7px] items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
          >
            <Clock size={12} color="#000000" strokeWidth={1.5} />
          </View>
          {/* Title - 13px, bold, black */}
          <Text className="text-[13px] font-coach-bold text-black">{title}</Text>
        </View>

        {/* Data content */}
        <View className="px-4 py-3.5">
          {/* Metrics row */}
          <View className="flex-row justify-between mb-2.5">
            <Metric label="Acute" value={data.acute} />
            <Metric label="Chronic" value={data.chronic} />
            <Metric label="Ratio" value={data.ratio} isWarning />
          </View>

          {/* Warning note box */}
          <View
            className="px-3 py-2 rounded-[10px]"
            style={{
              backgroundColor: "rgba(255,149,0,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,149,0,0.15)",
            }}
          >
            <Text className="text-[12px] font-coach-medium text-ora">
              {data.note}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
