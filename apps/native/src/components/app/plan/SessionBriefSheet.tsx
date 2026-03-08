/**
 * SessionBriefSheet - Bottom sheet with condensed session briefing
 * Opens when tapping SessionPreview cards or TodayCard Start button
 *
 * Content:
 * 1. Hero header with session type, distance, and duration
 * 2. SegmentBarChart (zone-colored vertical bars)
 * 3. PaceProfileChart (line + area chart)
 * 4. SessionZoneSplit (horizontal zone distribution)
 * 5. Start Session CTA button
 */

import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { useFont } from "@shopify/react-native-skia";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import Svg, { Polygon } from "react-native-svg";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { SegmentBarChart } from "@/components/app/session/SegmentBarChart";
import { PaceProfileChart } from "@/components/app/session/PaceProfileChart";
import { SessionZoneSplit } from "@/components/app/session/SessionZoneSplit";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";
import { getSessionDetail } from "@/components/app/session/mock-data";
import type { SessionData } from "./types";
import { getSessionColor } from "./utils";
import { DAYS, DATES } from "./types";

export interface SessionBriefSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  session: SessionData | null;
  dayIdx: number;
}

function PlayIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Polygon points="5,3 19,12 5,21" fill="#000" />
    </Svg>
  );
}

function HeroStat({
  label,
  value,
  unit,
  isHero = false,
}: {
  label: string;
  value: string;
  unit?: string;
  isHero?: boolean;
}) {
  const bgColor = isHero ? COLORS.lime : LIGHT_THEME.w1;
  const textColor = isHero ? "#000000" : LIGHT_THEME.wText;
  const labelColor = isHero ? "rgba(0,0,0,0.45)" : LIGHT_THEME.wMute;
  const unitColor = isHero ? "rgba(0,0,0,0.4)" : LIGHT_THEME.wMute;

  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: bgColor,
        borderWidth: isHero ? 0 : 1,
        borderColor: LIGHT_THEME.wBrd,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontFamily: FONT_WEIGHTS.medium,
          color: labelColor,
          textTransform: "uppercase",
          letterSpacing: 0.04 * 10,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline">
        <Text
          style={{
            fontSize: 22,
            fontFamily: FONT_WEIGHTS.extrabold,
            color: textColor,
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={{
              fontSize: 13,
              color: unitColor,
              marginLeft: 2,
            }}
          >
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

export function SessionBriefSheet({
  sheetRef,
  session,
  dayIdx,
}: SessionBriefSheetProps) {
  const router = useRouter();
  const chartFont = useFont(Outfit_400Regular, 9);

  const sessionDetail = getSessionDetail(dayIdx);
  const accentColor = session ? getSessionColor(session) : COLORS.lime;
  const isRest = session?.intensity === "rest";

  const segments = useMemo(
    () => sessionDetail?.segments ?? [],
    [sessionDetail]
  );
  const hasSegments = !isRest && segments.length > 0;

  const handleStartSession = () => {
    sheetRef.current?.dismiss();
    router.push({
      pathname: "/active-session",
      params: { dayIdx: String(dayIdx) },
    });
  };

  if (!session) {
    return (
      <BottomSheetModal ref={sheetRef} backgroundColor="#FFFFFF" borderRadius={28}>
        <View />
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundColor="#FFFFFF"
      borderRadius={28}
      scrollable={hasSegments}
      snapPoints={hasSegments ? ["85%"] : undefined}
    >
      <View className="px-5 pb-2">
        {/* Header: Accent bar + Type + Date */}
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
              className="text-[26px] font-coach-bold"
              style={{ color: LIGHT_THEME.wText, letterSpacing: -0.52 }}
            >
              {session.type}
            </Text>
            <Text
              className="text-xs font-coach-medium"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {DAYS[dayIdx]}, Feb {DATES[dayIdx]}
              {!isRest && session.desc ? ` \u00B7 ${session.desc}` : ""}
            </Text>
          </View>
        </View>

        {/* Hero Stats: Distance + Duration */}
        {!isRest && (
          <View className="flex-row gap-2 mb-4">
            <HeroStat label="Distance" value={session.km} unit="km" isHero />
            <HeroStat label="Duration" value={session.dur} />
          </View>
        )}

        {/* Charts */}
        {hasSegments && (
          <>
            <SegmentBarChart segments={segments} font={chartFont} />
            <PaceProfileChart segments={segments} font={chartFont} />
            <SessionZoneSplit segments={segments} />
          </>
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
