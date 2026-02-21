/**
 * SessionBriefSheet - Bottom sheet with condensed session briefing
 * Opens when tapping SessionPreview cards or TodayCard Start button
 *
 * Content:
 * 1. Session title and date header
 * 2. IntensityProfileChart
 * 3. OverviewGrid (Distance, Duration, Intensity)
 * 4. Start Session CTA button
 */

import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import Svg, { Polygon } from "react-native-svg";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { IntensityProfileChart } from "@/components/app/session/IntensityProfileChart";
import { OverviewGrid } from "@/components/app/session/OverviewGrid";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";
import { getSessionDetail } from "@/components/app/session/mock-data";
import type { SessionData } from "./types";
import { getSessionColor } from "./utils";
import { DAYS, DATES } from "./types";

export interface SessionBriefSheetProps {
  /** Ref for controlling the bottom sheet */
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  /** The session to display (null when not shown) */
  session: SessionData | null;
  /** Day index for date display and navigation */
  dayIdx: number;
}

/**
 * Play icon for the Start Session button
 */
function PlayIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Polygon points="5,3 19,12 5,21" fill="#000" />
    </Svg>
  );
}

export function SessionBriefSheet({
  sheetRef,
  session,
  dayIdx,
}: SessionBriefSheetProps) {
  const router = useRouter();

  // Get full session detail with segments for the chart
  const sessionDetail = getSessionDetail(dayIdx);
  const accentColor = session ? getSessionColor(session) : COLORS.lime;
  const isRest = session?.intensity === "rest";

  const handleStartSession = () => {
    sheetRef.current?.dismiss();
    router.push({
      pathname: "/active-session",
      params: { dayIdx: String(dayIdx) },
    });
  };

  // Don't render content if no session
  if (!session) {
    return (
      <BottomSheetModal ref={sheetRef} backgroundColor="#FFFFFF" borderRadius={28}>
        <View />
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal ref={sheetRef} backgroundColor="#FFFFFF" borderRadius={28}>
      <View className="px-5 pb-2">
        {/* Header: Date and Session Type */}
        <View className="flex-row items-center mb-4">
          <View
            style={{
              width: 4,
              height: 40,
              borderRadius: 2,
              backgroundColor: accentColor,
              marginRight: 12,
            }}
          />
          <View className="flex-1">
            <Text
              className="text-xs font-coach-medium"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {DAYS[dayIdx]}, Feb {DATES[dayIdx]}
              {!isRest && ` \u00B7 ${session.dur}`}
            </Text>
            <Text
              className="text-[22px] font-coach-bold"
              style={{ color: LIGHT_THEME.wText, letterSpacing: -0.44 }}
            >
              {session.type}
            </Text>
          </View>
        </View>

        {/* Intensity Profile Chart */}
        {sessionDetail?.segments && !isRest && sessionDetail.segments.length > 0 && (
          <IntensityProfileChart segments={sessionDetail.segments} />
        )}

        {/* Overview Grid */}
        {!isRest && (
          <OverviewGrid
            km={session.km}
            duration={session.dur}
            intensity={session.intensity}
          />
        )}

        {/* Start Session CTA */}
        {!isRest && !session.done && (
          <Pressable
            onPress={handleStartSession}
            className="mt-2 py-[16px] px-6 rounded-[16px] flex-row items-center justify-center gap-2.5 active:scale-[0.98]"
            style={{
              backgroundColor: LIGHT_THEME.wText,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: COLORS.lime,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlayIcon />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: FONT_WEIGHTS.bold,
                color: LIGHT_THEME.w1,
              }}
            >
              Start Session
            </Text>
          </Pressable>
        )}

        {/* Rest day message */}
        {isRest && (
          <View className="py-4">
            <Text
              className="text-center text-sm font-coach"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {session.desc}
            </Text>
          </View>
        )}

        {/* Completed session message */}
        {session.done && !isRest && (
          <View className="py-4">
            <Text
              className="text-center text-sm font-coach"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Session completed
            </Text>
          </View>
        )}
      </View>
    </BottomSheetModal>
  );
}
