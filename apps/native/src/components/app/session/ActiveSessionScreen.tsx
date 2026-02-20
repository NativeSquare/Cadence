/**
 * ActiveSessionScreen - Live workout tracking screen
 * Reference: cadence-full-v10.jsx ActiveSessionScreen (lines 404-594)
 *
 * Features:
 * - Live timer with h:m:s display
 * - Pause/Resume functionality
 * - Distance, Pace, Heart Rate metrics
 * - Current segment progress indicator
 * - Lap marker button
 * - End session confirmation overlay
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { View, Pressable } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Rect, Line, Polygon, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES, FONT_WEIGHTS, LIGHT_THEME } from "@/lib/design-tokens";
import type { SessionSegment } from "./types";

export interface ActiveSessionScreenProps {
  session: {
    type: string;
    km: string;
    segments: SessionSegment[];
  };
  onStop: (data: { elapsed: number; distance: number }) => void;
}

/**
 * Pulsing recording indicator dot
 */
function RecordingDot({ paused }: { paused: boolean }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (paused) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.ease }),
        withTiming(0.3, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, [paused]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: paused ? COLORS.ora : COLORS.lime,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Heart rate pulse icon
 */
function HeartIcon() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 500, easing: Easing.ease }),
        withTiming(1, { duration: 500, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
        <Path
          d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z"
          fill={COLORS.red}
        />
      </Svg>
    </Animated.View>
  );
}

export function ActiveSessionScreen({
  session,
  onStop,
}: ActiveSessionScreenProps) {
  const insets = useSafeAreaInsets();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [distance, setDistance] = useState(0);
  const [hr, setHr] = useState(142);
  const [showStop, setShowStop] = useState(false);
  const [segIdx, setSegIdx] = useState(0);

  const segments = session.segments || [];
  const curSeg = segments[segIdx] || segments[0];
  const totalKm = parseFloat(session.km) || 0;

  // Timer effect
  useEffect(() => {
    if (paused) return;

    timerRef.current = setInterval(() => {
      setElapsed((p) => p + 1);
      // Simulate distance increase (~10 km/h pace)
      setDistance((p) => p + 0.0028 + Math.random() * 0.0008);
      // Simulate heart rate variation
      setHr(Math.floor(138 + Math.random() * 16));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  // Auto advance segments based on distance
  useEffect(() => {
    if (segments.length <= 1) return;

    let cumDist = 0;
    for (let i = 0; i < segments.length; i++) {
      const segKm = parseFloat(segments[i].km) || 0;
      cumDist += segKm;
      if (distance < cumDist) {
        if (i !== segIdx) setSegIdx(i);
        break;
      }
    }
  }, [distance, segments, segIdx]);

  // Calculations
  const progress = totalKm > 0 ? Math.min(1, distance / totalKm) : 0;
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  // Current pace (min/km)
  const pace = distance > 0.01 ? elapsed / 60 / distance : 0;
  const paceMin = Math.floor(pace);
  const paceSec = Math.floor((pace - paceMin) * 60);

  // Segment progress
  const curSegKm = parseFloat(curSeg?.km) || 0;
  let segStartDist = 0;
  for (let i = 0; i < segIdx; i++) {
    segStartDist += parseFloat(segments[i]?.km) || 0;
  }
  const segProgress = curSegKm > 0 ? Math.min(1, (distance - segStartDist) / curSegKm) : 0;

  const handlePauseToggle = useCallback(() => {
    setPaused(!paused);
    setShowStop(false);
  }, [paused]);

  const handleLapOrEnd = useCallback(() => {
    if (paused) {
      setShowStop(true);
    } else {
      // Lap marker - could be enhanced
      console.log("Lap marked at", distance.toFixed(2), "km");
    }
  }, [paused, distance]);

  const handleConfirmEnd = useCallback(() => {
    onStop({ elapsed, distance });
  }, [elapsed, distance, onStop]);

  const handleCancelEnd = useCallback(() => {
    setShowStop(false);
    setPaused(false);
  }, []);

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="absolute inset-0 z-[500] bg-black"
    >
      <View
        className="absolute inset-0 z-10 flex-col"
        style={{ flex: 1 }}
      >
        {/* Top bar */}
        <View
          className="px-6 flex-shrink-0"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-2">
              <RecordingDot paused={paused} />
              <Text
                className="text-[13px]"
                style={{
                  fontFamily: FONT_WEIGHTS.semibold,
                  color: paused ? COLORS.ora : GRAYS.g3,
                }}
              >
                {paused ? "Paused" : "Recording"}
              </Text>
            </View>
            <Text
              className="text-[13px]"
              style={{
                fontFamily: FONT_WEIGHTS.medium,
                color: GRAYS.g4,
              }}
            >
              {session.type}
            </Text>
          </View>
        </View>

        {/* Current segment indicator */}
        {segments.length > 1 && (
          <View className="px-6 pt-3 flex-shrink-0">
            <View
              className="p-3 px-4 rounded-[14px]"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: SURFACES.brd,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Text
                    className="text-[11px] uppercase"
                    style={{
                      fontFamily: FONT_WEIGHTS.semibold,
                      color: GRAYS.g4,
                      letterSpacing: 0.05 * 11,
                    }}
                  >
                    Current
                  </Text>
                  <Text
                    className="text-[14px]"
                    style={{
                      fontFamily: FONT_WEIGHTS.bold,
                      color: COLORS.lime,
                    }}
                  >
                    {curSeg?.name}
                  </Text>
                </View>
                <Text
                  className="text-[12px]"
                  style={{
                    fontFamily: FONT_WEIGHTS.semibold,
                    color: GRAYS.g3,
                  }}
                >
                  {curSeg?.pace} /km
                </Text>
              </View>

              {/* Segment progress bar */}
              <View
                className="h-[3px] rounded-sm overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <View
                  className="h-full rounded-sm"
                  style={{
                    width: `${segProgress * 100}%`,
                    backgroundColor: COLORS.lime,
                  }}
                />
              </View>

              {/* Up next */}
              {segIdx < segments.length - 1 && (
                <View className="flex-row items-center gap-1.5 mt-2">
                  <Text
                    className="text-[10px]"
                    style={{
                      fontFamily: FONT_WEIGHTS.medium,
                      color: GRAYS.g4,
                    }}
                  >
                    Up next
                  </Text>
                  <Text
                    className="text-[12px]"
                    style={{
                      fontFamily: FONT_WEIGHTS.semibold,
                      color: GRAYS.g3,
                    }}
                  >
                    {segments[segIdx + 1]?.name} · {segments[segIdx + 1]?.km} km
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Big timer - center */}
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center">
            {/* Hours */}
            <View className="flex-row items-baseline gap-1">
              <Text
                style={{
                  fontFamily: FONT_WEIGHTS.light,
                  fontSize: 56,
                  color: GRAYS.g4,
                  letterSpacing: -0.04 * 56,
                  lineHeight: 56,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {pad(h)}
              </Text>
              <Text
                className="mb-2"
                style={{
                  fontFamily: FONT_WEIGHTS.medium,
                  fontSize: 14,
                  color: GRAYS.g4,
                }}
              >
                h
              </Text>
            </View>

            {/* Minutes */}
            <View className="flex-row items-baseline gap-1 -mt-2">
              <Text
                style={{
                  fontFamily: FONT_WEIGHTS.extrabold,
                  fontSize: 88,
                  color: COLORS.lime,
                  letterSpacing: -0.05 * 88,
                  lineHeight: 88,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {pad(m)}
              </Text>
              <Text
                className="mb-3.5"
                style={{
                  fontFamily: FONT_WEIGHTS.medium,
                  fontSize: 16,
                  color: COLORS.lime,
                }}
              >
                m
              </Text>
            </View>

            {/* Seconds */}
            <View className="flex-row items-baseline gap-1 -mt-1.5">
              <Text
                style={{
                  fontFamily: FONT_WEIGHTS.bold,
                  fontSize: 52,
                  color: GRAYS.g2,
                  letterSpacing: -0.04 * 52,
                  lineHeight: 52,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {pad(s)}
              </Text>
              <Text
                className="mb-1.5"
                style={{
                  fontFamily: FONT_WEIGHTS.medium,
                  fontSize: 14,
                  color: GRAYS.g3,
                }}
              >
                s
              </Text>
            </View>
          </View>
        </View>

        {/* Metrics bar */}
        <View className="px-6 flex-shrink-0">
          {/* Overall progress bar */}
          <View
            className="h-[3px] rounded-sm overflow-hidden mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <View
              className="h-full rounded-sm"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: COLORS.lime,
              }}
            />
          </View>

          {/* Metrics row */}
          <View className="flex-row justify-between items-end mb-5">
            {/* Distance */}
            <View>
              <Text
                className="text-[11px] uppercase"
                style={{
                  fontFamily: FONT_WEIGHTS.medium,
                  color: GRAYS.g4,
                  letterSpacing: 0.04 * 11,
                }}
              >
                Distance
              </Text>
              <View className="flex-row items-baseline gap-[3px] mt-0.5">
                <Text
                  style={{
                    fontFamily: FONT_WEIGHTS.extrabold,
                    fontSize: 28,
                    color: GRAYS.g1,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {distance.toFixed(2)}
                </Text>
                <Text
                  className="text-[13px]"
                  style={{
                    fontFamily: FONT_WEIGHTS.medium,
                    color: GRAYS.g4,
                  }}
                >
                  km
                </Text>
              </View>
            </View>

            {/* Pace */}
            <View className="items-center">
              <Text
                className="text-[11px] uppercase"
                style={{
                  fontFamily: FONT_WEIGHTS.medium,
                  color: GRAYS.g4,
                  letterSpacing: 0.04 * 11,
                }}
              >
                Pace
              </Text>
              <View className="flex-row items-baseline gap-0.5 mt-0.5">
                <Text
                  style={{
                    fontFamily: FONT_WEIGHTS.extrabold,
                    fontSize: 28,
                    color: GRAYS.g1,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {distance > 0.05 ? `${paceMin}:${pad(paceSec)}` : "--"}
                </Text>
                <Text
                  className="text-[13px]"
                  style={{
                    fontFamily: FONT_WEIGHTS.medium,
                    color: GRAYS.g4,
                  }}
                >
                  /km
                </Text>
              </View>
            </View>

            {/* Heart Rate */}
            <View className="items-end">
              <Text
                className="text-[11px] uppercase"
                style={{
                  fontFamily: FONT_WEIGHTS.medium,
                  color: GRAYS.g4,
                  letterSpacing: 0.04 * 11,
                }}
              >
                Heart Rate
              </Text>
              <View className="flex-row items-baseline gap-[3px] mt-0.5 justify-end">
                <HeartIcon />
                <Text
                  style={{
                    fontFamily: FONT_WEIGHTS.extrabold,
                    fontSize: 28,
                    color: GRAYS.g1,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {hr}
                </Text>
                <Text
                  className="text-[13px]"
                  style={{
                    fontFamily: FONT_WEIGHTS.medium,
                    color: GRAYS.g4,
                  }}
                >
                  bpm
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View
          className="px-4 flex-shrink-0"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="flex-row gap-2.5">
            {/* Lap / End button */}
            <Pressable
              onPress={handleLapOrEnd}
              className="flex-1 h-16 rounded-[18px] flex-row items-center justify-center gap-2"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1.5,
                borderColor: paused
                  ? `${COLORS.red}66`
                  : `${COLORS.lime}44`,
              }}
            >
              {paused ? (
                <>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Rect x={5} y={5} width={14} height={14} rx={2} fill={COLORS.red} />
                  </Svg>
                  <Text
                    className="text-[15px]"
                    style={{
                      fontFamily: FONT_WEIGHTS.bold,
                      color: COLORS.red,
                    }}
                  >
                    End
                  </Text>
                </>
              ) : (
                <>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Line
                      x1={12}
                      y1={5}
                      x2={12}
                      y2={19}
                      stroke={COLORS.lime}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    <Line
                      x1={5}
                      y1={12}
                      x2={19}
                      y2={12}
                      stroke={COLORS.lime}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <Text
                    className="text-[15px]"
                    style={{
                      fontFamily: FONT_WEIGHTS.semibold,
                      color: COLORS.lime,
                    }}
                  >
                    Lap
                  </Text>
                </>
              )}
            </Pressable>

            {/* Pause / Resume button */}
            <Pressable
              onPress={handlePauseToggle}
              className="flex-1 h-16 rounded-[18px] flex-row items-center justify-center gap-2 active:scale-95"
              style={{ backgroundColor: COLORS.lime }}
            >
              {paused ? (
                <>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Polygon points="6,3 20,12 6,21" fill={COLORS.black} />
                  </Svg>
                  <Text
                    className="text-[16px]"
                    style={{
                      fontFamily: FONT_WEIGHTS.extrabold,
                      color: COLORS.black,
                    }}
                  >
                    Resume
                  </Text>
                </>
              ) : (
                <>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Rect x={6} y={4} width={4} height={16} rx={1} fill={COLORS.black} />
                    <Rect x={14} y={4} width={4} height={16} rx={1} fill={COLORS.black} />
                  </Svg>
                  <Text
                    className="text-[16px]"
                    style={{
                      fontFamily: FONT_WEIGHTS.extrabold,
                      color: COLORS.black,
                    }}
                  >
                    Pause
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Stop confirmation overlay */}
      {showStop && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 z-[600] items-center justify-center p-8"
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
          }}
        >
          <Text
            className="text-[22px] mb-2"
            style={{
              fontFamily: FONT_WEIGHTS.bold,
              color: GRAYS.g1,
            }}
          >
            End Session?
          </Text>
          <Text
            className="text-[14px] text-center mb-8"
            style={{
              fontFamily: FONT_WEIGHTS.regular,
              color: GRAYS.g3,
              lineHeight: 14 * 1.5,
            }}
          >
            You've covered {distance.toFixed(2)} km in {pad(m)}:{pad(s)}. Your
            session data will be saved.
          </Text>

          <Pressable
            onPress={handleConfirmEnd}
            className="w-full py-[18px] rounded-2xl mb-2.5 active:opacity-80"
            style={{ backgroundColor: COLORS.red }}
          >
            <Text
              className="text-[16px] text-center"
              style={{
                fontFamily: FONT_WEIGHTS.bold,
                color: LIGHT_THEME.w1,
              }}
            >
              End & Save
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCancelEnd}
            className="w-full py-[18px] rounded-2xl active:opacity-80"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: SURFACES.brd,
            }}
          >
            <Text
              className="text-[16px] text-center"
              style={{
                fontFamily: FONT_WEIGHTS.semibold,
                color: GRAYS.g2,
              }}
            >
              Resume
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}
