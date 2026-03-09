/**
 * AnalyticsScreen - Main container for the Analytics tab
 *
 * Layout (top to bottom):
 * 1. Volume Evolution (Strava-style bar + line chart)
 * 2. Race Predictions (VDOT-based race time estimates)
 * 3. Runner Profile Radar (6-axis spider chart)
 * 4. Training Zones Breakdown (zone distribution)
 * 5. Health Metrics (HR, HRV, sleep, readiness)
 * 6. Stats Grid (2x2 summary)
 *
 * Gated behind placement runs (10 completed runs to unlock).
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useFont } from "@shopify/react-native-skia";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { ACTIVITY_COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import {
  TimeFrameSelector,
  type TimeFrame,
} from "@/components/shared/time-frame-selector";

import { PlacementGate } from "./placement-gate";
import { RunnerProfileCard } from "./runner-profile-card";
import { PredictionCard } from "./prediction-card";
import { PredictionTrendSheet } from "./prediction-trend-sheet";
import { VolumeBarChart } from "./volume-bar-chart";
import { ZoneBreakdown } from "./ZoneBreakdown";
import { ObjectiveSelector } from "./objective-selector";
import { StatsGrid } from "./StatsGrid";
import { HealthMetricsCard } from "./health-metrics-card";
import { useAnalyticsData, getVolumeBarData } from "@/hooks/use-analytics-data";
import {
  OBJECTIVE_OPTIONS,
  type RaceObjective,
} from "./mock-data";

function AnalyticsPlaceholder() {
  return (
    <View className="px-5 py-6">
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 100, backgroundColor: LIGHT_THEME.w3 }}
      />
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 280, backgroundColor: LIGHT_THEME.w3 }}
      />
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 200, backgroundColor: LIGHT_THEME.w3 }}
      />
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 196, backgroundColor: LIGHT_THEME.w3 }}
      />
      <View
        className="mb-3 rounded-[20px]"
        style={{ height: 178, backgroundColor: LIGHT_THEME.w3 }}
      />
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-1 rounded-2xl" style={{ height: 100, minWidth: "45%", backgroundColor: LIGHT_THEME.w3 }} />
        <View className="flex-1 rounded-2xl" style={{ height: 100, minWidth: "45%", backgroundColor: LIGHT_THEME.w3 }} />
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
  const volumeBar = useMemo(
    () => getVolumeBarData(volumeTimeFrame, data?.volumeByTimeframe),
    [volumeTimeFrame, data?.volumeByTimeframe],
  );

  const trendSheetRef = useRef<GorhomBottomSheetModal>(null);
  const [trendDistance, setTrendDistance] = useState<string | null>(null);

  const handlePredictionTap = useCallback((distance: string) => {
    setTrendDistance(distance);
    trendSheetRef.current?.present();
  }, []);

  const objectiveOption = useMemo(
    () => OBJECTIVE_OPTIONS.find((o) => o.id === objective)!,
    [objective]
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-w2 items-center justify-center">
        <Text className="text-wMute">Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-w2 items-center justify-center p-6">
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
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
      >
        {/* Dark header area */}
        <View className="bg-black">
          <View
            className="px-6 pb-5"
            style={{ paddingTop: insets.top + 12 }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[28px] font-coach-bold text-g1"
                style={{ letterSpacing: -0.03 * 28 }}
              >
                Analytics
              </Text>
              <ObjectiveSelector
                selected={objective}
                onSelect={setObjective}
              />
            </View>
            <Text className="text-[14px] font-coach text-g3 mt-1">
              {objectiveOption.planWeeks}-week {objectiveOption.label.toLowerCase()} plan
            </Text>
          </View>
          <View
            className="bg-w2 h-7"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />
        </View>

        <View className="flex-1 bg-w2 pb-6">
          {isFocused ? (
            <View className="px-5 py-6">
              {/* 1. Volume Evolution (Strava-style) */}
              <View className="p-5 rounded-[20px] mb-3" style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.08)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.10,
                shadowRadius: 16,
                elevation: 4,
              }}>
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text
                      className="text-[12px] font-coach-semibold text-wSub uppercase"
                      style={{ letterSpacing: 0.05 * 12 }}
                    >
                      Volume Over Time
                    </Text>
                    <View className="flex-row items-baseline gap-1 mt-1">
                      <Text className="text-[28px] font-coach-extrabold text-wText">
                        {volumeBar.total}
                      </Text>
                      <Text className="text-[14px] font-coach text-wSub">
                        {volumeBar.unitLabel}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-[10px] py-[5px] rounded-lg"
                    style={{ backgroundColor: "rgba(168,217,0,0.12)" }}
                  >
                    <Text
                      className="text-[13px] font-coach-semibold"
                      style={{ color: ACTIVITY_COLORS.barHigh }}
                    >
                      +{data.volumeStats.weekOverWeekChange}%
                    </Text>
                  </View>
                </View>
                <VolumeBarChart
                  key={volumeTimeFrame}
                  data={volumeBar.barData}
                  labels={volumeBar.labels}
                  font={smallChartFont}
                />
                <View className="mt-4">
                  <TimeFrameSelector
                    selected={volumeTimeFrame}
                    onSelect={setVolumeTimeFrame}
                    variant="light"
                  />
                </View>
              </View>

              {/* 2. Race Predictions (individual tile cards) */}
              <View className="mb-3">
                <PredictionCard
                  predictions={data.predictions}
                  objective={objective}
                  onTileTap={handlePredictionTap}
                />
              </View>

              {/* 3. Runner Profile Radar */}
              <View className="mb-3">
                <RunnerProfileCard data={data.radarData} />
              </View>

              {/* 4. Training Zones Breakdown */}
              <View className="mb-3">
                <ZoneBreakdown data={data.zoneBreakdown} />
              </View>

              {/* 5. Health Metrics */}
              <View className="mb-3">
                <HealthMetricsCard metrics={data.healthMetrics} />
              </View>

              {/* 6. Training Stats */}
              <View className="mb-3">
                <StatsGrid stats={data.stats} />
              </View>
            </View>
          ) : (
            <AnalyticsPlaceholder />
          )}
        </View>
      </Animated.ScrollView>

      <PredictionTrendSheet
        sheetRef={trendSheetRef}
        distance={trendDistance}
      />
    </View>
  );
}

