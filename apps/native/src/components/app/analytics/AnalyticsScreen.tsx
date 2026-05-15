import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { WeeklyDistanceCard } from "./cards/WeeklyDistanceCard";
import { TypeMixCard } from "./cards/TypeMixCard";
import { EasyPaceDriftCard } from "./cards/EasyPaceDriftCard";
import { PlannedVsActualCard } from "./cards/PlannedVsActualCard";

const HORIZONTAL_PADDING = 20;
// Card uses p-5 (20px) on each side, plus 1px border on each side.
const CARD_INNER_PADDING = 20 * 2 + 1 * 2;

export function AnalyticsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);

  // Fetch 52 weeks back; each card slices its own window from this set.
  const startDate = oneYearAgoIso();
  const workouts = useQuery(api.agoge.workouts.listWorkouts, { startDate });

  const chartWidth = Math.max(
    0,
    containerWidth - HORIZONTAL_PADDING * 2 - CARD_INNER_PADDING,
  );

  return (
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />

      <View className="bg-black">
        <View className="px-6 pb-5" style={{ paddingTop: insets.top + 12 }}>
          <Text
            className="text-[28px] font-coach-bold text-g1"
            style={{ letterSpacing: -0.03 * 28 }}
          >
            {t("analytics.title")}
          </Text>
          <Text className="text-[13px] font-coach text-g3 mt-1">
            {t("analytics.subtitle")}
          </Text>
        </View>
        <View
          className="bg-w2 h-7"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        />
      </View>

      <ScrollView
        className="flex-1 bg-w2"
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingTop: 4,
          paddingBottom: insets.bottom + 32,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {workouts === undefined ? (
          <View className="py-16 items-center">
            <ActivityIndicator color={LIGHT_THEME.wText} />
          </View>
        ) : containerWidth === 0 ? null : (
          <>
            <WeeklyDistanceCard workouts={workouts} width={chartWidth} />
            <TypeMixCard workouts={workouts} width={chartWidth} />
            <EasyPaceDriftCard workouts={workouts} width={chartWidth} />
            <PlannedVsActualCard workouts={workouts} width={chartWidth} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function oneYearAgoIso(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString();
}
