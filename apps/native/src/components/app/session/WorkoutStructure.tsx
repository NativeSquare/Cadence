/**
 * WorkoutStructure - List of workout segments
 * Reference: cadence-full-v10.jsx lines 311-333
 *
 * Features:
 * - Section header with uppercase styling
 * - Segment rows with colored bar indicator
 * - Zone/pace info + distance display
 * - Staggered reveal animation (splitReveal .35s, 0.06s delay)
 * - Divider lines between segments
 * - Container: rounded 20px, background w1, border wBrd
 */

import React from "react";
import { View } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, ACTIVITY_COLORS, FONT_WEIGHTS } from "@/lib/design-tokens";
import type { SessionSegment } from "./types";
import { getZoneColor } from "./types";

export interface WorkoutStructureProps {
  /** Session segments to display */
  segments: SessionSegment[];
}

/**
 * Individual segment row
 */
function SegmentRow({
  segment,
  index,
  isLast,
}: {
  segment: SessionSegment;
  index: number;
  isLast: boolean;
}) {
  const isRest = segment.zone === "Z1";
  const segmentColor = isRest ? ACTIVITY_COLORS.barRest : getZoneColor(segment.zone);

  return (
    <Animated.View
      entering={FadeInLeft.duration(350)
        .delay(index * 60)
        .withInitialValues({ opacity: 0, transform: [{ translateX: -10 }] })}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: LIGHT_THEME.wBrd,
      }}
    >
      {/* Colored bar indicator */}
      <View
        style={{
          width: 4,
          height: 36,
          borderRadius: 2,
          backgroundColor: segmentColor,
          marginRight: 14,
        }}
      />

      {/* Segment info */}
      <View className="flex-1">
        <Text
          style={{
            fontSize: 15,
            fontFamily: FONT_WEIGHTS.semibold,
            color: LIGHT_THEME.wText,
          }}
        >
          {segment.name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: LIGHT_THEME.wMute,
            marginTop: 2,
          }}
        >
          {segment.zone} · {segment.pace} /km
        </Text>
      </View>

      {/* Distance */}
      <View className="items-end">
        <Text
          style={{
            fontSize: 17,
            fontFamily: FONT_WEIGHTS.bold,
            color: LIGHT_THEME.wText,
          }}
        >
          {segment.km}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: LIGHT_THEME.wMute,
          }}
        >
          km
        </Text>
      </View>
    </Animated.View>
  );
}

export function WorkoutStructure({ segments }: WorkoutStructureProps) {
  return (
    <View className="mb-4">
      {/* Section header */}
      <Text
        className="text-[11px] font-coach-semibold text-wMute uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Workout Structure
      </Text>

      {/* Segments container */}
      <View
        className="rounded-[20px] bg-w1 border border-wBrd overflow-hidden"
      >
        {segments.map((segment, index) => (
          <SegmentRow
            key={`${segment.name}-${index}`}
            segment={segment}
            index={index}
            isLast={index === segments.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
