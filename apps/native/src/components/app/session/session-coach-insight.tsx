import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS, CARD_SHADOW } from "@/lib/design-tokens";

export interface SessionCoachInsightProps {
  justification: string;
  physiologicalTarget: string;
  placementRationale?: string;
  keyPoints?: string[];
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
  keyPoints,
}: SessionCoachInsightProps) {
  const physioLabel = PHYSIO_LABELS[physiologicalTarget] ?? physiologicalTarget;

  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Coach Insight
      </Text>

      {/* Why this session */}
      <View
        className="mb-3"
        style={{ padding: 18, paddingHorizontal: 20, borderRadius: 18, backgroundColor: COLORS.lime }}
      >
        <View className="flex-row items-center gap-[7px] mb-2.5">
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#000000", opacity: 0.2 }} />
          <Text style={{ fontSize: 11, fontFamily: FONT_WEIGHTS.semibold, color: "rgba(0,0,0,0.4)" }}>
            Why This Session
          </Text>
        </View>
        <Text style={{ fontSize: 15, fontFamily: FONT_WEIGHTS.medium, color: "#000000", lineHeight: 23 }}>
          {justification}
        </Text>
      </View>

      {/* Physiological target + placement */}
      <View className="rounded-2xl bg-w1 p-4 mb-3" style={CARD_SHADOW}>
        <View className="flex-row items-center gap-2.5 mb-2">
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.lime }} />
          <Text style={{ fontSize: 13, fontFamily: FONT_WEIGHTS.semibold, color: LIGHT_THEME.wText }}>
            {physioLabel}
          </Text>
        </View>
        {placementRationale && (
          <Text style={{ fontSize: 13, color: LIGHT_THEME.wSub, lineHeight: 19 }}>
            {placementRationale}
          </Text>
        )}
      </View>

      {/* Key points */}
      {keyPoints && keyPoints.length > 0 && (
        <View className="rounded-2xl bg-w1" style={{ padding: 16, paddingHorizontal: 18, ...CARD_SHADOW }}>
          <Text
            style={{ fontSize: 12, fontFamily: FONT_WEIGHTS.semibold, color: LIGHT_THEME.wMute, textTransform: "uppercase", letterSpacing: 0.55, marginBottom: 10 }}
          >
            Focus Points
          </Text>
          {keyPoints.map((point, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
                paddingVertical: 6,
                borderBottomWidth: i < keyPoints.length - 1 ? 1 : 0,
                borderBottomColor: LIGHT_THEME.wBrd,
              }}
            >
              <Text style={{ fontSize: 14, color: LIGHT_THEME.wText, lineHeight: 20, flex: 1 }}>
                {point}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
