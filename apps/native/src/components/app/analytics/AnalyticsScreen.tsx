/**
 * AnalyticsScreen - Main container for the Analytics tab
 * Reference: cadence-full-v9.jsx AnalyticsTab component (lines 486-601)
 *
 * Features:
 * - Dark header with title and plan summary
 * - Plan progress bar (10 weeks with phase colors)
 * - Volume and streak cards
 * - Daily KM histogram
 * - Zone split stacked histogram
 * - Volume and pace trend line charts
 * - Stats grid (2x2)
 * - All charts animate on mount (self-contained per component)
 */

import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";

import { PlanProgress } from "./PlanProgress";
import { WeekVolumeCard } from "./WeekVolumeCard";
import { StreakCard } from "./StreakCard";
import { Histogram } from "./Histogram";
import { StackedHistogram, ZoneLegend } from "./StackedHistogram";
import { VolumeChart, PaceChart } from "./LineChart";
import { StatsGrid } from "./StatsGrid";
import { useAnalyticsData } from "@/hooks/use-analytics-data";

/**
 * AnalyticsScreen main component
 *
 * Layout from prototype (lines 486-601):
 * - Dark header: bg-black, pt-[62px], px-6, pb-[18px]
 * - Light content: bg-w2, rounded-t-[28px], -mt-1
 * - Content padding: px-4, py-[22px], pb-[120px]
 */
export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useAnalyticsData();

  // Loading state
  if (isLoading || !data) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-g3">Loading analytics...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Text className="text-red text-center">
          Unable to load analytics data
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-w2 relative">
      {/* Black status bar background */}
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
          {/* Rounded corner transition */}
          <View
            className="bg-w2 h-7"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />
        </View>

        {/* Light content area */}
        <View className="flex-1 bg-w2 pb-6">
          <View className="px-4 py-[22px]">
            {/* Plan Progress */}
            <View className="mb-3">
              <PlanProgress data={data.planProgress} />
            </View>

            {/* Volume + Streak Cards Row */}
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

            {/* Daily KM Histogram */}
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
              />
            </View>

            {/* Zone Split Histogram */}
            <View className="p-[18px] rounded-[20px] bg-w1 border border-wBrd mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-[11px] font-coach-semibold text-wMute uppercase"
                  style={{ letterSpacing: 0.05 * 11 }}
                >
                  Zone Split · Daily
                </Text>
                <ZoneLegend />
              </View>
              <StackedHistogram
                data={data.zoneChartData}
                accentIdx={data.todayIndex}
              />
            </View>

            {/* Volume Line Chart */}
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
                    +8%
                  </Text>
                </View>
              </View>
              <VolumeChart data={data.volumeChartData} />
            </View>

            {/* Pace Line Chart */}
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
              <PaceChart data={data.paceChartData} />
            </View>

            {/* Stats Grid */}
            <StatsGrid stats={data.stats} />
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
