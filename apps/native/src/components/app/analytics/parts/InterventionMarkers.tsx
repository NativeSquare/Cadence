/**
 * Pinging overlay dot rendered on top of an Analytics chart wherever the
 * coach made a deterministic plan change. Tapping the dot opens the
 * intervention detail sheet.
 *
 * The chart itself draws a faint dashed line under each marker (see
 * `InterventionVerticals` for the SVG-side helper). This component only
 * owns the animated tap-target on top, because react-native-svg doesn't
 * play well with the looping ping animation we want.
 */

import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Line } from "react-native-svg";
import { COLORS } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";

export type ChartIntervention = {
  _id: string;
  ruleId: string;
  firedAt: number;
  signals: {
    hrvToday: number;
    hrvBaseline14d: number;
    hrvZScore: number;
    sleepHoursLastNight?: number;
    rhrToday?: number;
  };
  originalType: string;
  originalName: string;
  originalDistanceMeters?: number;
  originalDurationSeconds?: number;
  newType: string;
  newName: string;
  newDistanceMeters?: number;
  newDurationSeconds?: number;
  notificationBody?: string;
  revertedAt?: number;
};

export type ChartMarker = {
  intervention: ChartIntervention;
  leftPx: number;
};

const DOT_SIZE = 10;
const HIT_SLOP = 14;

export function InterventionMarkers({
  markers,
  topPx,
  onPress,
}: {
  markers: ChartMarker[];
  topPx: number;
  onPress: (intervention: ChartIntervention) => void;
}) {
  if (markers.length === 0) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: topPx,
        height: DOT_SIZE + HIT_SLOP * 2,
      }}
    >
      {markers.map((m) => (
        <Marker
          key={m.intervention._id}
          marker={m}
          onPress={() => {
            selectionFeedback();
            onPress(m.intervention);
          }}
        />
      ))}
    </View>
  );
}

/**
 * SVG-side companion: dashed vertical line under each marker, anchored from
 * the marker's top to the chart's x-axis. Drawn inside the chart's <Svg> so
 * it sits behind the bars/lines.
 */
export function InterventionVerticals({
  markers,
  topY,
  bottomY,
}: {
  markers: ChartMarker[];
  topY: number;
  bottomY: number;
}) {
  return (
    <>
      {markers.map((m) => (
        <Line
          key={m.intervention._id}
          x1={m.leftPx}
          x2={m.leftPx}
          y1={topY}
          y2={bottomY}
          stroke={COLORS.lime}
          strokeOpacity={0.45}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      ))}
    </>
  );
}

function Marker({
  marker,
  onPress,
}: {
  marker: ChartMarker;
  onPress: () => void;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.4 }],
    opacity: 0.55 * (1 - pulse.value),
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      style={{
        position: "absolute",
        left: marker.leftPx - DOT_SIZE / 2,
        top: 0,
        width: DOT_SIZE,
        height: DOT_SIZE,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: COLORS.lime,
          },
          ringStyle,
        ]}
      />
      <View
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: COLORS.lime,
          shadowColor: COLORS.lime,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 4,
        }}
      />
    </Pressable>
  );
}
