import { useState } from "react";
import { View, Pressable } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS, CARD_SHADOW } from "@/lib/design-tokens";

export interface SessionCoachInsightProps {
  justification: string;
  physiologicalTarget: string;
  placementRationale?: string;
  defaultExpanded?: boolean;
}

const PHYSIO_LABELS: Record<string, string> = {
  aerobic_base: "Aerobic Base",
  lactate_threshold: "Lactate Threshold",
  vo2max: "VO2 Max",
  economy: "Running Economy",
  recovery: "Recovery",
  race_performance: "Race Performance",
};

export function SessionCoachInsight({
  justification,
  physiologicalTarget,
  placementRationale,
  defaultExpanded = false,
}: SessionCoachInsightProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const physioLabel = PHYSIO_LABELS[physiologicalTarget] ?? physiologicalTarget;

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="rounded-2xl bg-w1"
        style={CARD_SHADOW}
      >
        {/* Collapsed header — always visible */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            paddingHorizontal: 18,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: COLORS.lime,
              marginRight: 10,
            }}
          />
          <Text
            style={{
              fontSize: 13,
              fontFamily: FONT_WEIGHTS.semibold,
              color: LIGHT_THEME.wText,
              flex: 1,
            }}
          >
            Coach Insight · {physioLabel}
          </Text>
          <View
            style={{
              transform: [{ rotate: expanded ? "180deg" : "0deg" }],
            }}
          >
            <ChevronDown size={18} color={LIGHT_THEME.wMute} />
          </View>
        </View>

        {/* Expanded content */}
        {expanded && (
          <View
            style={{
              paddingHorizontal: 18,
              paddingBottom: 16,
              borderTopWidth: 1,
              borderTopColor: LIGHT_THEME.wBrd,
            }}
          >
            {/* Justification */}
            <Text
              style={{
                fontSize: 14,
                color: LIGHT_THEME.wText,
                lineHeight: 21,
                marginTop: 14,
              }}
            >
              {justification}
            </Text>

            {/* Placement rationale */}
            {placementRationale && (
              <Text
                style={{
                  fontSize: 13,
                  color: LIGHT_THEME.wSub,
                  lineHeight: 19,
                  marginTop: 10,
                }}
              >
                {placementRationale}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}
