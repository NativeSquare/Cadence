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

import { useMemo, useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useFont } from "@shopify/react-native-skia";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import { Text } from "@/components/ui/text";
import { ACTIVITY_COLORS, GRAYS } from "@/lib/design-tokens";
import {
  TimeFrameSelector,
  type TimeFrame,
} from "@/components/shared/time-frame-selector";

import { PlacementGate } from "./placement-gate";
import { PlanProgress } from "./PlanProgress";
import { RunnerProfileCard } from "./runner-profile-card";
import { PredictionCard } from "./prediction-card";
import { WeekVolumeCard } from "./WeekVolumeCard";
import { StreakCard } from "./StreakCard";
import { VolumeChart } from "./LineChart";
import { ZoneBreakdown } from "./ZoneBreakdown";
import { ObjectiveSelector } from "./objective-selector";
import { StatsGrid } from "./StatsGrid";
import { HealthMetricsCard } from "./health-metrics-card";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import {
  OBJECTIVE_OPTIONS,
  TARGET_PROFILES,
  type RaceObjective,
} from "./mock-data";

function AnalyticsPlaceholder() {
  return (
    <View className="px-4 py-[22px]">
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 100, backgroundColor: GRAYS.g6 }}
      />
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 280, backgroundColor: GRAYS.g6 }}
      />
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 200, backgroundColor: GRAYS.g6 }}
      />
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 196, backgroundColor: GRAYS.g6 }}
      />
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 178, backgroundColor: GRAYS.g6 }}
      />
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-1 rounded-2xl" style={{ height: 100, minWidth: "45%", backgroundColor: GRAYS.g6 }} />
        <View className="flex-1 rounded-2xl" style={{ height: 100, minWidth: "45%", backgroundColor: GRAYS.g6 }} />
      </View>
    </View>
  );
}

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { data, placement, isLoading, error } = useAnalyticsData();

  const smallChartFont = useFont(Outfit_400Regular, 9);

  const [objective, setObjective] = useState<RaceObjective>("half");
  const [devSkipGate, setDevSkipGate] = useState(false);

  const [volumeTimeFrame, setVolumeTimeFrame] = useState<TimeFrame>("3mo");

  const objectiveOption = useMemo(
    () => OBJECTIVE_OPTIONS.find((o) => o.id === objective)!,
    [objective]
  );
  const targetRadarData = useMemo(
    () => TARGET_PROFILES[objective],
    [objective]
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-w1 items-center justify-center">
        <Text className="text-wMute">Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-w1 items-center justify-center p-6">
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
    <View className="flex-1 bg-black relative">
      <View
        className="absolute top-0 left-0 right-0 bg-w1 z-10"
        style={{ height: insets.top }}
      />
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
      >
        {/* Light header area */}
        <View className="bg-w1">
          <View
            className="px-6 pb-[18px]"
            style={{ paddingTop: insets.top + 12 }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-2xl font-coach-bold text-wText"
                style={{ letterSpacing: -0.03 * 24 }}
              >
                Analytics
              </Text>
              <ObjectiveSelector
                selected={objective}
                onSelect={setObjective}
                variant="light"
              />
            </View>
            <Text className="text-[13px] font-coach text-wMute mt-1">
              {objectiveOption.planWeeks}-week {objectiveOption.label.toLowerCase()} plan
            </Text>
          </View>
          <View
            className="bg-black h-7"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />
        </View>

        <View className="flex-1 bg-black pb-6">
          {isFocused ? (
            <View className="px-4 py-[22px]">
              {/* 1. Plan Progress */}
              <View className="mb-3">
                <PlanProgress data={data.planProgress} />
              </View>

              {/* 2. Runner Profile Radar (dual: current + objective target) */}
              <View className="mb-3">
                <RunnerProfileCard
                  data={data.radarData}
                  targetData={targetRadarData}
                  objectiveLabel={objectiveOption.label}
                />
              </View>

              {/* 3. Race Predictions (tiles + tap-to-expand trend) */}
              <View className="mb-3">
                <PredictionCard
                  predictions={data.predictions}
                  objective={objective}
                />
              </View>

              {/* 4. Volume Evolution (Strava-style) */}
              <View className="p-[18px] rounded-[20px] mb-3" style={{ backgroundColor: "#1A1A1A" }}>
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text
                      className="text-[11px] font-coach-semibold text-g3 uppercase"
                      style={{ letterSpacing: 0.05 * 11 }}
                    >
                      Volume Over Time
                    </Text>
                    <View className="flex-row items-baseline gap-1 mt-1">
                      <Text className="text-2xl font-coach-extrabold text-g1">
                        {Math.round(data.volumeChartData.reduce((sum, d) => sum + d.volume, 0))}
                      </Text>
                      <Text className="text-[13px] font-coach text-g3">
                        km total
                      </Text>
                    </View>
                  </View>
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
                />
                <View className="mt-4">
                  <TimeFrameSelector
                    selected={volumeTimeFrame}
                    onSelect={setVolumeTimeFrame}
                  />
                </View>
              </View>

              {/* 5. Training Zones Breakdown (Strava-style) */}
              <View className="mb-3">
                <ZoneBreakdown data={data.zoneBreakdown} />
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

              {/* 7. Health Metrics */}
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

