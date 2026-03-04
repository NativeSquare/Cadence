/**
 * AnalyticsScreen - Main container for the Analytics tab
 *
 * Layout (top to bottom):
 * 1. Plan Progress (condensed training block overview)
 * 2. Runner Profile Radar (6-axis spider chart)
 * 3. Race Predictions (VDOT-based race time estimates)
 * 4. Volume Evolution (Strava-style bar + line chart)
 * 5. Zone Time Evolution (COROS-style multi-week zone distribution)
 * 6. This Week section (daily histogram + daily zone split)
 * 7. Health Metrics (HR, HRV, sleep, readiness)
 * 8. Stats Grid (2x2 summary)
 *
 * Gated behind placement runs (10 completed runs to unlock).
 */

import { useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useFont } from "@shopify/react-native-skia";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";

import { PlacementGate } from "./placement-gate";
import { PlanProgress } from "./PlanProgress";
import { RunnerProfileCard } from "./runner-profile-card";
import { PredictionCard } from "./prediction-card";
import { WeekVolumeCard } from "./WeekVolumeCard";
import { StreakCard } from "./StreakCard";
import { Histogram } from "./Histogram";
import { StackedHistogram, WeeklyZoneChart, ZoneLegend } from "./StackedHistogram";
import { VolumeChart, PaceChart } from "./LineChart";
import { StatsGrid } from "./StatsGrid";
import { HealthMetricsCard } from "./health-metrics-card";
import { useAnalyticsData } from "@/hooks/use-analytics-data";

function AnalyticsPlaceholder() {
  return (
    <View className="px-4 py-[22px]">
      <View
        className="mb-3 rounded-[20px] bg-w1 border border-wBrd"
        style={{ height: 100 }}
      />
      <View
        className="mb-3 rounded-[20px] bg-w1 border border-wBrd"
        style={{ height: 280 }}
      />
      <View
        className="mb-3 rounded-[20px] bg-w1 border border-wBrd"
        style={{ height: 200 }}
      />
      <View
        className="mb-3 rounded-[20px] bg-w1 border border-wBrd"
        style={{ height: 196 }}
      />
      <View
        className="mb-3 rounded-[20px] bg-w1 border border-wBrd"
        style={{ height: 178 }}
      />
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-1 rounded-2xl bg-w1 border border-wBrd" style={{ height: 100, minWidth: "45%" }} />
        <View className="flex-1 rounded-2xl bg-w1 border border-wBrd" style={{ height: 100, minWidth: "45%" }} />
      </View>
    </View>
  );
}

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { data, placement, isLoading, error } = useAnalyticsData();

  const chartFont = useFont(Outfit_400Regular, 10);
  const smallChartFont = useFont(Outfit_400Regular, 9);

  const [zoneView, setZoneView] = useState<"daily" | "weekly">("weekly");
  const [devSkipGate, setDevSkipGate] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-g3">Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Text className="text-red text-center">
          Unable to load analytics data
        </Text>
      </View>
    );
  }

  if (placement && !placement.isUnlocked && !devSkipGate) {
    return (
      <PlacementGate
        completedRuns={placement.completedRuns}
        threshold={placement.threshold}
        onSkip={() => setDevSkipGate(true)}
      />
    );
  }

  if (!data) return null;

  return (
    <View className="flex-1 bg-w2 relative">
      <View
        className="absolute top-0 left-0 right-0 bg-black z-10"
        style={{ height: insets.top }}
      />
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
      >
        {/* Dark header area */}
        <View className="bg-black">
          <View
            className="px-6 pb-[18px]"
            style={{ paddingTop: insets.top + 12 }}
          >
            <Text
              className="text-2xl font-coach-bold text-g1"
              style={{ letterSpacing: -0.03 * 24 }}
            >
              Analytics
            </Text>
            <Text className="text-[13px] font-coach text-g4 mt-1">
              10-week half marathon plan
            </Text>
          </View>
          <View
            className="bg-w2 h-7"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />
        </View>

        <View className="flex-1 bg-w2 pb-6">
          {isFocused ? (
            <View className="px-4 py-[22px]">
              {/* 1. Plan Progress */}
              <View className="mb-3">
                <PlanProgress data={data.planProgress} />
              </View>

              {/* 2. Runner Profile Radar */}
              <View className="mb-3">
                <RunnerProfileCard data={data.radarData} />
              </View>

              {/* 3. Race Predictions */}
              <View className="mb-3">
                <PredictionCard
                  vdot={data.vdot}
                  predictions={data.predictions}
                />
              </View>

              {/* 4. Volume Evolution (Strava-style) */}
              <View className="p-[18px] rounded-[20px] bg-w1 border border-wBrd mb-3">
                <View className="flex-row items-center justify-between mb-4">
                  <Text
                    className="text-[11px] font-coach-semibold text-wMute uppercase"
                    style={{ letterSpacing: 0.05 * 11 }}
                  >
                    Volume Over Time
                  </Text>
                  <View
                    className="px-[10px] py-[5px] rounded-lg"
                    style={{ backgroundColor: "rgba(168,217,0,0.1)" }}
                  >
                    <Text
                      className="text-xs font-coach-semibold"
                      style={{ color: ACTIVITY_COLORS.barHigh }}
                    >
                      +{data.volumeStats.weekOverWeekChange}%
                    </Text>
                  </View>
                </View>
                <VolumeChart
                  data={data.volumeChartData}
                  font={smallChartFont}
                  currentWeek={data.currentWeek}
                />
              </View>

              {/* 5. Zone Time Evolution (COROS-style) */}
              <View className="p-[18px] rounded-[20px] bg-w1 border border-wBrd mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    className="text-[11px] font-coach-semibold text-wMute uppercase"
                    style={{ letterSpacing: 0.05 * 11 }}
                  >
                    Zone Distribution
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <ZoneViewToggle
                      active={zoneView}
                      onToggle={setZoneView}
                    />
                    <ZoneLegend />
                  </View>
                </View>
                {zoneView === "weekly" ? (
                  <WeeklyZoneChart
                    data={data.multiWeekZoneData}
                    currentWeek={data.currentWeek}
                    font={chartFont}
                  />
                ) : (
                  <StackedHistogram
                    data={data.zoneChartData}
                    accentIdx={data.todayIndex}
                    font={chartFont}
                  />
                )}
              </View>

              {/* 6. This Week - Volume + Streak + Daily KM */}
              <View className="flex-row gap-2 mb-3">
                <WeekVolumeCard
                  currentVolume={data.volumeStats.currentVolume}
                  plannedVolume={data.volumeStats.plannedVolume}
                  weekOverWeekChange={data.volumeStats.weekOverWeekChange}
                />
                <StreakCard
                  streak={data.volumeStats.streak}
                  streakDays={data.volumeStats.streakDays}
                />
              </View>

              <View className="p-[18px] rounded-[20px] bg-w1 border border-wBrd mb-3">
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text
                      className="text-[11px] font-coach-semibold text-wMute uppercase"
                      style={{ letterSpacing: 0.05 * 11 }}
                    >
                      This Week · Daily KM
                    </Text>
                    <View className="flex-row items-baseline gap-1 mt-1">
                      <Text className="text-2xl font-coach-extrabold text-wText">
                        {data.volumeStats.plannedVolume}
                      </Text>
                      <Text className="text-[13px] font-coach text-wMute">
                        km planned
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-[10px] py-[5px] rounded-lg"
                    style={{ backgroundColor: LIGHT_THEME.w3 }}
                  >
                    <Text className="text-xs font-coach-medium text-wSub">
                      W{data.currentWeek}
                    </Text>
                  </View>
                </View>
                <Histogram
                  data={data.histogramChartData}
                  accentIdx={data.todayIndex}
                  font={chartFont}
                />
              </View>

              {/* 7. Pace Trend */}
              <View className="p-[18px] rounded-[20px] bg-w1 border border-wBrd mb-3">
                <View className="flex-row items-center justify-between mb-4">
                  <Text
                    className="text-[11px] font-coach-semibold text-wMute uppercase"
                    style={{ letterSpacing: 0.05 * 11 }}
                  >
                    Avg Pace Trend
                  </Text>
                  <View
                    className="px-[10px] py-[5px] rounded-lg"
                    style={{ backgroundColor: "rgba(168,217,0,0.1)" }}
                  >
                    <Text
                      className="text-xs font-coach-semibold"
                      style={{ color: ACTIVITY_COLORS.barHigh }}
                    >
                      -33s
                    </Text>
                  </View>
                </View>
                <PaceChart data={data.paceChartData} font={smallChartFont} />
              </View>

              {/* 8. Health Metrics */}
              <View className="mb-3">
                <HealthMetricsCard metrics={data.healthMetrics} />
              </View>

              {/* 9. Stats Grid */}
              <StatsGrid stats={data.stats} />
            </View>
          ) : (
            <AnalyticsPlaceholder />
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function ZoneViewToggle({
  active,
  onToggle,
}: {
  active: "daily" | "weekly";
  onToggle: (view: "daily" | "weekly") => void;
}) {
  return (
    <View
      className="flex-row rounded-md overflow-hidden"
      style={{ backgroundColor: LIGHT_THEME.w3 }}
    >
      <ToggleButton
        label="W"
        isActive={active === "weekly"}
        onPress={() => onToggle("weekly")}
      />
      <ToggleButton
        label="D"
        isActive={active === "daily"}
        onPress={() => onToggle("daily")}
      />
    </View>
  );
}

function ToggleButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <View
      className="px-2 py-[3px]"
      style={{
        backgroundColor: isActive ? LIGHT_THEME.w1 : "transparent",
        borderRadius: isActive ? 4 : 0,
      }}
      onTouchEnd={onPress}
    >
      <Text
        className="text-[9px] font-coach-semibold"
        style={{
          color: isActive ? LIGHT_THEME.wText : LIGHT_THEME.wMute,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
