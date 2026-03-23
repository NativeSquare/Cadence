import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";

export interface SessionCompletedComparisonProps {
  plannedDistanceKm: string;
  plannedDuration: string;
  actualDistanceKm?: string;
  actualDuration?: string;
  adherenceScore?: number;
  userRating?: number;
  userFeedback?: string;
}

function ComparisonRow({ label, planned, actual }: { label: string; planned: string; actual?: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_THEME.wBrd,
      }}
    >
      <Text style={{ flex: 1, fontSize: 13, fontFamily: FONT_WEIGHTS.medium, color: LIGHT_THEME.wSub }}>{label}</Text>
      <Text style={{ fontSize: 15, fontFamily: FONT_WEIGHTS.semibold, color: LIGHT_THEME.wMute, marginRight: 16 }}>
        {planned}
      </Text>
      <Text style={{ fontSize: 15, fontFamily: FONT_WEIGHTS.bold, color: LIGHT_THEME.wText }}>
        {actual ?? "-"}
      </Text>
    </View>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: 16, opacity: star <= rating ? 1 : 0.2 }}>
          ★
        </Text>
      ))}
    </View>
  );
}

export function SessionCompletedComparison({
  plannedDistanceKm,
  plannedDuration,
  actualDistanceKm,
  actualDuration,
  adherenceScore,
  userRating,
  userFeedback,
}: SessionCompletedComparisonProps) {
  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wMute uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Results
      </Text>

      {/* Planned vs Actual */}
      <View className="rounded-2xl bg-w1 border border-wBrd px-4 mb-3">
        {/* Column headers */}
        <View className="flex-row items-center pt-3 pb-1">
          <View className="flex-1" />
          <Text style={{ fontSize: 10, fontFamily: FONT_WEIGHTS.medium, color: LIGHT_THEME.wMute, textTransform: "uppercase", letterSpacing: 0.4, marginRight: 16, width: 60, textAlign: "right" }}>
            Planned
          </Text>
          <Text style={{ fontSize: 10, fontFamily: FONT_WEIGHTS.medium, color: LIGHT_THEME.wMute, textTransform: "uppercase", letterSpacing: 0.4, width: 60, textAlign: "right" }}>
            Actual
          </Text>
        </View>
        <ComparisonRow label="Distance" planned={`${plannedDistanceKm} km`} actual={actualDistanceKm ? `${actualDistanceKm} km` : undefined} />
        <ComparisonRow label="Duration" planned={plannedDuration} actual={actualDuration} />
        {adherenceScore !== undefined && (
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
            <Text style={{ flex: 1, fontSize: 13, fontFamily: FONT_WEIGHTS.medium, color: LIGHT_THEME.wSub }}>Adherence</Text>
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: adherenceScore >= 0.8 ? "rgba(74,222,128,0.12)" : "rgba(255,149,0,0.12)" }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: FONT_WEIGHTS.bold,
                  color: adherenceScore >= 0.8 ? COLORS.grn : COLORS.ora,
                }}
              >
                {Math.round(adherenceScore * 100)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* User feedback */}
      {(userRating || userFeedback) && (
        <View className="rounded-2xl bg-w1 border border-wBrd p-4">
          {userRating && (
            <View className="flex-row items-center gap-3 mb-2">
              <Text style={{ fontSize: 13, fontFamily: FONT_WEIGHTS.medium, color: LIGHT_THEME.wSub }}>Rating</Text>
              <StarDisplay rating={userRating} />
            </View>
          )}
          {userFeedback && (
            <Text style={{ fontSize: 14, color: LIGHT_THEME.wText, lineHeight: 20 }}>
              {userFeedback}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
