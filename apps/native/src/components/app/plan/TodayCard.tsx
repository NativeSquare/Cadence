/**
 * TodayCard - Main card showing today's workout with coach message
 *
 * Layout order: Sync banner → Workout info → Coach quote → CTA
 * When a sync status is active, the entire card is visually wrapped:
 * - Card border color matches the sync state
 * - Full-width banner at top with icon + label
 *
 * Features:
 * - Sync banner wraps the card (top banner + colored border)
 * - Workout details with vertical accent bar
 * - Coach quote section with lime background
 * - "Start Workout" CTA button
 * - Pulsing dot during streaming animation
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import Svg, { Path, Circle } from "react-native-svg";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { type WorkoutData, type SyncStatus } from "./types";
import { getWorkoutColor, getSyncStatusLabel, getSyncStatusColor, formatShortDate } from "./utils";
import { useStream } from "./use-stream";

interface TodayCardProps {
  workout: WorkoutData;
  coachMessage: string;
  selectedDate?: Date;
  isToday?: boolean;
  onStartPress?: () => void;
  onExportPress?: () => void;
  onCardPress?: () => void;
  /** Pass to show a "+ Add a workout" button on rest days (today / future). */
  onAddPress?: () => void;
}

// ─── Shared animation components ────────────────────────────────────────────

function CoachPulsingDot({ isStreaming, color = "#000000" }: { isStreaming: boolean; color?: string }) {
  const opacity = useSharedValue(0.25);
  useEffect(() => {
    if (isStreaming) {
      opacity.value = withRepeat(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        -1, true
      );
    } else {
      opacity.value = 0.25;
    }
  }, [isStreaming, opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[animatedStyle, { backgroundColor: color }]}
      className="w-1.5 h-1.5 rounded-full"
    />
  );
}

function BlinkingCursor() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0, { duration: 400 }), -1, true);
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[animatedStyle, { width: 2, height: 14, backgroundColor: COLORS.black, marginLeft: 2 }]}
    />
  );
}

function WatchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 2V6" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M15 2V6" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 18V22" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M15 18V22" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={12} r={7} stroke="#1A1A1A" strokeWidth={2} />
      <Path d="M12 9V12L14 14" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuoteMark({ position }: { position: "open" | "close" }) {
  const isOpen = position === "open";
  return (
    <Text
      className="font-coach"
      style={{
        position: "absolute",
        top: isOpen ? 8 : undefined,
        bottom: isOpen ? undefined : 4,
        left: isOpen ? 12 : undefined,
        right: isOpen ? undefined : 12,
        fontSize: 48, fontWeight: "800",
        color: "rgba(0,0,0,0.08)", lineHeight: 48,
      }}
    >
      {isOpen ? "\u201C" : "\u201D"}
    </Text>
  );
}

// ─── Sync banner components ─────────────────────────────────────────────────

/** Spinning sync arrows for syncing state */
function SpinningSyncIcon({ color, size = 16 }: { color: string; size?: number }) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1, false
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 12C21 16.97 16.97 21 12 21C9.36 21 7.01 19.88 5.34 18.1L7.5 15.94C8.6 17.22 10.21 18 12 18C15.31 18 18 15.31 18 12H15L19 8L23 12H21Z"
          fill={color}
        />
        <Path
          d="M3 12C3 7.03 7.03 3 12 3C14.64 3 16.99 4.12 18.66 5.9L16.5 8.06C15.4 6.78 13.79 6 12 6C8.69 6 6 8.69 6 12H9L5 16L1 12H3Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

/** White icon for inside the colored circle */
function SyncBannerIcon({ status }: { status: SyncStatus }) {
  const w = "#FFFFFF";
  switch (status) {
    case "exported":
      // Tick — export completed successfully
      return (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12.5L9.5 18L20 6" stroke={w} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "synced":
      // Double tick — data received and confirmed (dark on lime)
      return (
        <Svg width={14} height={12} viewBox="0 0 28 24" fill="none">
          <Path d="M2 12.5L7.5 18L18 6" stroke="#1A1A1A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M10 12.5L15.5 18L26 6" stroke="#1A1A1A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "failed":
      // Exclamation
      return (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M12 6V14" stroke={w} strokeWidth={3} strokeLinecap="round" />
          <Path d="M12 18V18.01" stroke={w} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

/** Banner background tints */
const SYNC_BANNER_BG: Record<string, string> = {
  exported: "rgba(255,255,255,0.06)",
  syncing: "rgba(255,149,0,0.10)",
  synced: "rgba(200,255,0,0.12)",
  failed: "rgba(255,90,90,0.10)",
};

/** Icon for the "not synced" state — cloud with an off-slash */
function NotSyncedIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8V12L14 14"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={12}
        cy={12}
        r={7}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2}
      />
      <Path
        d="M9 2V5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M15 2V5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M9 19V22"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M15 19V22"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Full-width sync banner — sits at the top of the card.
 * Shows "Not synced with watch" when no export, or the sync status after export.
 */
function SyncBanner({ workout }: { workout: WorkoutData }) {
  const { syncStatus, syncSource, syncedData } = workout;
  const isRest = workout.intensity === "rest";

  if (isRest) return null;

  if (!syncStatus || syncStatus === "planned") {
    return (
      <View
        className="flex-row items-center gap-2.5 px-4 py-2.5"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        <NotSyncedIcon />
        <Text
          className="text-[12px] font-coach-medium"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Not synced with watch
        </Text>
      </View>
    );
  }

  const rawColor = getSyncStatusColor(syncStatus);
  const isExported = syncStatus === "exported";
  const textColor = isExported ? "rgba(255,255,255,0.60)" : rawColor;
  const circleBg = isExported ? "rgba(255,255,255,0.12)" : rawColor;
  const label = getSyncStatusLabel(syncStatus, syncSource, syncedData);
  const bg = SYNC_BANNER_BG[syncStatus] ?? SYNC_BANNER_BG.exported;

  return (
    <View
      className="flex-row items-center gap-2.5 px-4 py-2.5"
      style={{ backgroundColor: bg }}
    >
      {syncStatus === "syncing" ? (
        <SpinningSyncIcon color={textColor} size={18} />
      ) : (
        <View
          style={{
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: circleBg,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <SyncBannerIcon status={syncStatus} />
        </View>
      )}
      <Text className="text-[13px] font-coach-bold" style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Card sections ──────────────────────────────────────────────────────────

function CoachQuote({
  displayed, done, started,
}: {
  displayed: string; done: boolean; started: boolean;
}) {
  return (
    <View
      className="mx-3.5 mb-3 p-4 rounded-2xl bg-lime"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <QuoteMark position="open" />
      <QuoteMark position="close" />
      <View className="flex-row items-center gap-1.5 mb-2.5" style={{ position: "relative", zIndex: 2 }}>
        <CoachPulsingDot isStreaming={!done && started} />
        <Text className="text-[11px] font-coach-semibold" style={{ color: "rgba(0,0,0,0.4)" }}>
          Coach
        </Text>
      </View>
      <View className="flex-row flex-wrap items-end" style={{ position: "relative", zIndex: 2 }}>
        <Text className="text-[15px] font-coach-medium text-black" style={{ lineHeight: 23 }}>
          {displayed}
        </Text>
        {!done && started && <BlinkingCursor />}
      </View>
    </View>
  );
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CompletedBanner({ workout }: { workout: WorkoutData }) {
  const actualPace = computeActualPace(workout);

  return (
    <View
      className="px-4 pt-3.5 pb-3"
      style={{ backgroundColor: "rgba(200,255,0,0.10)" }}
    >
      <View className="flex-row items-center gap-2 mb-2.5">
        <View
          style={{
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: COLORS.lime,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M4 12.5L9.5 18L20 6" stroke="#1A1A1A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text className="text-[13px] font-coach-bold" style={{ color: COLORS.lime }}>
          Workout Complete
        </Text>
      </View>
      <View className="flex-row gap-5">
        {workout.actualDur != null && (
          <View>
            <Text className="text-[11px] font-coach-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              Time
            </Text>
            <Text className="text-[15px] font-coach-bold text-g1">
              {workout.actualDur}
            </Text>
          </View>
        )}
        {workout.actualKm != null && (
          <View>
            <Text className="text-[11px] font-coach-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              Distance
            </Text>
            <Text className="text-[15px] font-coach-bold text-g1">
              {workout.actualKm} km
            </Text>
          </View>
        )}
        {actualPace != null && (
          <View>
            <Text className="text-[11px] font-coach-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              Pace
            </Text>
            <Text className="text-[15px] font-coach-bold text-g1">
              {actualPace}
            </Text>
          </View>
        )}
        {workout.adherenceScore != null && (
          <View>
            <Text className="text-[11px] font-coach-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              Adherence
            </Text>
            <Text className="text-[15px] font-coach-bold" style={{ color: COLORS.lime }}>
              {Math.round(workout.adherenceScore * 100)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function computeActualPace(workout: WorkoutData): string | null {
  if (!workout.actualDur || !workout.actualKm) return null;
  // Parse actualKm to number
  const km = parseFloat(workout.actualKm);
  if (!km || km === 0) return null;
  // Parse actualDur to seconds — supports "45min", "1h05", "1h"
  let totalSec = 0;
  const hMatch = workout.actualDur.match(/(\d+)h/);
  const mMatch = workout.actualDur.match(/(\d+)min/) ?? workout.actualDur.match(/h(\d+)/);
  if (hMatch) totalSec += parseInt(hMatch[1], 10) * 3600;
  if (mMatch) totalSec += parseInt(mMatch[1], 10) * 60;
  if (totalSec === 0) return null;
  const paceSecPerKm = totalSec / km;
  const pMin = Math.floor(paceSecPerKm / 60);
  const pSec = Math.round(paceSecPerKm % 60);
  return `${pMin}:${pSec.toString().padStart(2, "0")}/km`;
}

function WorkoutInfo({ workout }: { workout: WorkoutData }) {
  const accentColor = getWorkoutColor(workout);
  const isRest = workout.intensity === "rest";

  return (
    <View className="px-5 pt-5 pb-3">
      <View className="flex-row items-center gap-2.5 mb-2">
        <View
          style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: accentColor,
          }}
        />
        <Text className="text-xs font-coach-medium text-g3 uppercase" style={{ letterSpacing: 0.05 * 12 }}>
          {isRest ? "Rest Day" : `${workout.dur} · ${workout.km} km · ${workout.zone}`}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[26px] font-coach-bold text-g1 flex-1"
          style={{ letterSpacing: -0.02 * 26, lineHeight: 30 }}
        >
          {workout.type}
        </Text>
        <ChevronRight />
      </View>
    </View>
  );
}

function ExportToWatchCTA({ onPress }: { onPress?: () => void }) {
  return (
    <View className="px-4 pb-4">
      <Pressable
        className="py-[14px] px-5 rounded-[14px] flex-row items-center justify-center gap-2 active:scale-[0.98]"
        style={{ backgroundColor: "#FFFFFF" }}
        onPress={(e) => {
          e.stopPropagation();
          onPress?.();
        }}
      >
        <WatchIcon />
        <Text className="text-[15px] font-coach-semibold" style={{ color: "#1A1A1A" }}>
          Export to Watch
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

function RestDayCard({
  dateLabel,
  onCardPress,
  onAddPress,
}: {
  dateLabel: string;
  onCardPress?: () => void;
  onAddPress?: () => void;
}) {
  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wMute px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {dateLabel}
      </Text>

      <Pressable onPress={onCardPress} className="active:opacity-95">
        <View
          className="rounded-[20px] overflow-hidden px-5 pt-5 pb-5"
          style={{
            backgroundColor: LIGHT_THEME.w3,
            borderWidth: 1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <View className="flex-row items-center gap-2.5 mb-1.5">
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: LIGHT_THEME.wMute,
              }}
            />
            <Text
              className="text-xs font-coach-medium uppercase"
              style={{ letterSpacing: 0.05 * 12, color: LIGHT_THEME.wMute }}
            >
              Rest Day
            </Text>
          </View>

          <Text
            className="text-[22px] font-coach-semibold"
            style={{
              letterSpacing: -0.02 * 22,
              lineHeight: 28,
              color: LIGHT_THEME.wSub,
            }}
          >
            No workout scheduled
          </Text>

          {onAddPress && (
            <Pressable
              onPress={onAddPress}
              className="mt-4 flex-row items-center gap-2 self-start rounded-full px-4 py-2.5 active:opacity-85"
              style={{
                backgroundColor: LIGHT_THEME.wText,
              }}
            >
              <Text
                className="font-coach-bold text-[13px]"
                style={{ color: "#FFFFFF" }}
              >
                + Add a workout
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </View>
  );
}

export function TodayCard({ workout, coachMessage, selectedDate, isToday = true, onStartPress, onExportPress, onCardPress, onAddPress }: TodayCardProps) {
  const dateLabel = isToday ? "Today" : formatShortDate(selectedDate ?? new Date());
  const isRest = workout.intensity === "rest";
  const isCompleted = workout.done;

  if (isRest) {
    return (
      <RestDayCard
        dateLabel={dateLabel}
        onCardPress={onCardPress}
        onAddPress={onAddPress}
      />
    );
  }

  const { displayed, done, started } = useStream(coachMessage, {
    speed: 20, delay: 800,
  });

  const hasSyncStatus = workout.syncStatus && workout.syncStatus !== "planned";
  const isExported = workout.syncStatus === "exported" || workout.syncStatus === "synced";
  const borderColor = isCompleted
    ? COLORS.lime
    : hasSyncStatus
      ? getSyncStatusColor(workout.syncStatus!)
      : undefined;

  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wMute px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {dateLabel}
      </Text>

      <Pressable onPress={onCardPress} className="active:opacity-95">
        <View
          className="rounded-[20px] overflow-hidden"
          style={{
            backgroundColor: "#1A1A1A",
            borderWidth: isCompleted ? 1.5 : hasSyncStatus ? 1.5 : 1,
            borderColor: borderColor ?? "rgba(255,255,255,0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* 0. Top banner — completed state takes priority over sync banner */}
          {isCompleted ? (
            <CompletedBanner workout={workout} />
          ) : (
            <SyncBanner workout={workout} />
          )}

          {/* 1. Workout info */}
          <WorkoutInfo workout={workout} />

          {/* 2. Coach quote */}
          <CoachQuote displayed={displayed} done={done} started={started} />

          {/* 3. CTA — hide when completed or already exported */}
          {!isCompleted && !isExported && <ExportToWatchCTA onPress={onExportPress} />}
        </View>
      </Pressable>
    </View>
  );
}
