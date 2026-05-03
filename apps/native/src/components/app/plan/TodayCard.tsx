/**
 * TodayCard - Main card showing today's (or selected day's) workout.
 *
 * Two internal layouts:
 * - PlannedView   — pre-workout. Compact structure preview + coach + CTA.
 * - CompletedView — post-workout. Big metrics + adherence; structure deferred
 *                   to the detail page.
 *
 * Sync state is a small inline badge (top-right), shown only for active
 * states (exported / syncing / synced / failed). The "not sent to a provider"
 * default is no longer surfaced — that's the resting state and adds noise.
 *
 * Border color reflects workout status only (completed = lime, otherwise
 * subtle). Sync state never repaints the border.
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
import { useEffect, type ReactNode } from "react";
import Svg, { Path, Circle } from "react-native-svg";
import type { Repeat, Step } from "@nativesquare/agoge";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import {
  INTENT_COLORS,
  INTENT_LABELS,
  formatDuration,
  formatTarget,
} from "@/components/app/workout/workout-helpers";
import { type WorkoutData, type SyncStatus } from "./types";
import { formatShortDate } from "./utils";
import { useStream } from "./use-stream";

interface TodayCardProps {
  workout: WorkoutData;
  coachMessage: string;
  selectedDate?: Date;
  isToday?: boolean;
  onExportPress?: () => void;
  onCardPress?: () => void;
  /** Pass to show a "+ Add a workout" button on rest days (today / future). */
  onAddPress?: () => void;
}

// ─── Animation primitives ───────────────────────────────────────────────────

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

function SpinningSyncIcon({ color, size = 12 }: { color: string; size?: number }) {
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

// ─── SVG icons ──────────────────────────────────────────────────────────────

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

function CheckIcon({ size = 10, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12.5L9.5 18L20 6" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DoubleCheckIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size + 2} height={size} viewBox="0 0 28 24" fill="none">
      <Path d="M2 12.5L7.5 18L18 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 12.5L15.5 18L26 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertIcon({ size = 10, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6V14" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M12 18V18.01" stroke={color} strokeWidth={3} strokeLinecap="round" />
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
      {isOpen ? "“" : "”"}
    </Text>
  );
}

// ─── Sync badge (inline) ────────────────────────────────────────────────────

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  garmin: "Garmin",
  coros: "Coros",
};

function providerShort(syncSource?: string): string {
  if (!syncSource) return "watch";
  return PROVIDER_DISPLAY_NAMES[syncSource] ?? syncSource;
}

interface SyncBadgeContent {
  icon: ReactNode;
  label: string;
  color: string;
}

function syncBadgeContent(status: SyncStatus, syncSource?: string): SyncBadgeContent | null {
  const provider = providerShort(syncSource);
  switch (status) {
    case "exported":
      return {
        icon: <CheckIcon color="rgba(255,255,255,0.7)" />,
        label: provider,
        color: "rgba(255,255,255,0.7)",
      };
    case "syncing":
      return {
        icon: <SpinningSyncIcon color={COLORS.ora} />,
        label: "Syncing",
        color: COLORS.ora,
      };
    case "synced":
      return {
        icon: <DoubleCheckIcon color={COLORS.lime} />,
        label: provider,
        color: COLORS.lime,
      };
    case "failed":
      return {
        icon: <AlertIcon color={COLORS.red} />,
        label: "Sync failed",
        color: COLORS.red,
      };
    default:
      return null;
  }
}

function SyncBadge({ workout }: { workout: WorkoutData }) {
  if (!workout.syncStatus || workout.syncStatus === "planned") return null;
  const content = syncBadgeContent(workout.syncStatus, workout.syncSource);
  if (!content) return null;
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      {content.icon}
      <Text
        className="text-[11px] font-coach-semibold"
        style={{ color: content.color }}
      >
        {content.label}
      </Text>
    </View>
  );
}

// ─── Structure preview ──────────────────────────────────────────────────────

const MAX_STRUCTURE_LINES = 4;

function formatBlockLine(block: Step | Repeat): { label: string; dot: string } {
  if (block.kind === "step") {
    const dur = formatDuration(block.duration);
    const target = formatTarget(block.target);
    const dot = INTENT_COLORS[block.intent];

    if (block.intent === "work") {
      return {
        label: target ? `${dur} @ ${target}` : dur,
        dot,
      };
    }
    const head = block.name ?? INTENT_LABELS[block.intent];
    const tail = target ? ` @ ${target}` : "";
    return { label: `${head} · ${dur}${tail}`, dot };
  }

  const work = block.children.find((c) => c.intent === "work") ?? block.children[0];
  const rec = block.children.find(
    (c) => c.intent === "recovery" || c.intent === "rest" || c.intent === "active",
  );
  if (!work) return { label: `${block.count}× repeat`, dot: INTENT_COLORS.work };

  const workDur = formatDuration(work.duration);
  const workTarget = formatTarget(work.target);
  const workStr = workTarget ? `${workDur} @ ${workTarget}` : workDur;
  const recStr = rec ? ` · rec ${formatDuration(rec.duration)}` : "";
  return {
    label: `${block.count}× ${workStr}${recStr}`,
    dot: INTENT_COLORS.work,
  };
}

function StructurePreview({ workout }: { workout: WorkoutData }) {
  const blocks = workout.structure?.blocks;
  if (!blocks || blocks.length === 0) return null;

  const visible = blocks.slice(0, MAX_STRUCTURE_LINES);
  const overflow = blocks.length - visible.length;

  return (
    <View className="px-5 pb-3 gap-2">
      {visible.map((block, i) => {
        const line = formatBlockLine(block);
        return (
          <View key={i} className="flex-row items-center gap-2.5">
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: line.dot,
              }}
            />
            <Text
              numberOfLines={1}
              className="flex-1 text-[13px] font-coach-medium text-g1"
            >
              {line.label}
            </Text>
          </View>
        );
      })}
      {overflow > 0 && (
        <Text
          className="text-[12px] font-coach-medium pl-[14px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          + {overflow} more
        </Text>
      )}
    </View>
  );
}

// ─── Volume summary ─────────────────────────────────────────────────────────

function volumeSummary(workout: WorkoutData): string | null {
  const hasKm = workout.km && workout.km !== "-";
  const hasDur = workout.dur && workout.dur !== "-";
  if (!hasKm && !hasDur) return null;
  if (hasKm && hasDur) return `${workout.km} km · ${workout.dur}`;
  return hasKm ? `${workout.km} km` : (workout.dur ?? null);
}

function StructureTotal({ workout }: { workout: WorkoutData }) {
  const total = volumeSummary(workout);
  if (!total) return null;
  return (
    <View className="px-5 pb-3">
      <Text
        className="text-[12px] font-coach-medium"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        Total · {total}
      </Text>
    </View>
  );
}

// ─── Kind label ─────────────────────────────────────────────────────────────

/** Format the agoge taxonomic type into a readable uppercase label.
 * e.g. "race_pace" → "RACE PACE", "vo2max" → "VO2 MAX". */
function formatKind(kind: string): string {
  if (kind === "vo2max") return "VO2 MAX";
  return kind.replace(/_/g, " ").toUpperCase();
}

// ─── Header (shared) ────────────────────────────────────────────────────────

function CardHeader({
  workout,
  showSyncBadge,
}: {
  workout: WorkoutData;
  showSyncBadge: boolean;
}) {
  const kindLabel = workout.kind ? formatKind(workout.kind) : null;

  return (
    <View className="px-5 pt-5 pb-3">
      <View className="flex-row items-start justify-between mb-1.5">
        {kindLabel ? (
          <Text
            className="text-[11px] font-coach-semibold uppercase"
            style={{ letterSpacing: 0.08 * 11, color: "rgba(255,255,255,0.45)" }}
            numberOfLines={1}
          >
            {kindLabel}
          </Text>
        ) : (
          <View />
        )}
        {showSyncBadge && <SyncBadge workout={workout} />}
      </View>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[26px] font-coach-bold text-g1 flex-1"
          style={{ letterSpacing: -0.02 * 26, lineHeight: 30 }}
          numberOfLines={2}
        >
          {workout.type}
        </Text>
        <ChevronRight />
      </View>
    </View>
  );
}

// ─── Coach quote ────────────────────────────────────────────────────────────

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

// ─── Completed banner + metrics ─────────────────────────────────────────────

function CompletedHeaderBanner({ workout }: { workout: WorkoutData }) {
  const provider = workout.syncSource ? providerShort(workout.syncSource) : null;
  return (
    <View
      className="px-4 pt-3 pb-3 flex-row items-center justify-between"
      style={{ backgroundColor: "rgba(200,255,0,0.10)" }}
    >
      <View className="flex-row items-center gap-2">
        <View
          style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: COLORS.lime,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <CheckIcon color="#1A1A1A" size={11} />
        </View>
        <Text className="text-[13px] font-coach-bold" style={{ color: COLORS.lime }}>
          Workout Complete
        </Text>
      </View>
      {provider && (
        <View className="flex-row items-center gap-1.5">
          <DoubleCheckIcon color={COLORS.lime} size={12} />
          <Text
            className="text-[11px] font-coach-semibold"
            style={{ color: "rgba(200,255,0,0.85)" }}
          >
            via {provider}
          </Text>
        </View>
      )}
    </View>
  );
}

function computeActualPace(workout: WorkoutData): string | null {
  if (!workout.actualDur || !workout.actualKm) return null;
  const km = parseFloat(workout.actualKm);
  if (!km || km === 0) return null;
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

function CompletedMetrics({ workout }: { workout: WorkoutData }) {
  const actualPace = computeActualPace(workout);
  const cells: { label: string; value: string; accent?: boolean }[] = [];
  if (workout.actualDur != null) {
    cells.push({ label: "Time", value: workout.actualDur });
  }
  if (workout.actualKm != null) {
    cells.push({ label: "Distance", value: `${workout.actualKm} km` });
  }
  if (actualPace != null) {
    cells.push({ label: "Pace", value: actualPace });
  }
  if (workout.adherenceScore != null) {
    cells.push({
      label: "Adherence",
      value: `${Math.round(workout.adherenceScore * 100)}%`,
      accent: true,
    });
  }
  if (cells.length === 0) return null;

  return (
    <View className="px-5 pb-3 flex-row gap-5">
      {cells.map((c) => (
        <View key={c.label}>
          <Text
            className="text-[11px] font-coach-medium"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {c.label}
          </Text>
          <Text
            className="text-[15px] font-coach-bold"
            style={{ color: c.accent ? COLORS.lime : LIGHT_THEME.w1 }}
          >
            {c.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────────

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

// ─── Layouts ────────────────────────────────────────────────────────────────

function PlannedView({
  workout,
  coachMessage,
  onExportPress,
}: {
  workout: WorkoutData;
  coachMessage: string;
  onExportPress?: () => void;
}) {
  const { displayed, done, started } = useStream(coachMessage, {
    speed: 20, delay: 800,
  });
  const isExported =
    workout.syncStatus === "exported" || workout.syncStatus === "synced";

  return (
    <>
      <CardHeader workout={workout} showSyncBadge />
      <StructurePreview workout={workout} />
      <StructureTotal workout={workout} />
      <CoachQuote displayed={displayed} done={done} started={started} />
      {!isExported && <ExportToWatchCTA onPress={onExportPress} />}
    </>
  );
}

function CompletedView({
  workout,
  coachMessage,
}: {
  workout: WorkoutData;
  coachMessage: string;
}) {
  const { displayed, done, started } = useStream(coachMessage, {
    speed: 20, delay: 800,
  });
  return (
    <>
      <CompletedHeaderBanner workout={workout} />
      <CardHeader workout={workout} showSyncBadge={false} />
      <CompletedMetrics workout={workout} />
      <CoachQuote displayed={displayed} done={done} started={started} />
    </>
  );
}

// ─── Rest day ───────────────────────────────────────────────────────────────

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

// ─── Main ───────────────────────────────────────────────────────────────────

export function TodayCard({
  workout,
  coachMessage,
  selectedDate,
  isToday = true,
  onExportPress,
  onCardPress,
  onAddPress,
}: TodayCardProps) {
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
            borderWidth: isCompleted ? 1.5 : 1,
            borderColor: isCompleted ? COLORS.lime : "rgba(255,255,255,0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {isCompleted ? (
            <CompletedView workout={workout} coachMessage={coachMessage} />
          ) : (
            <PlannedView
              workout={workout}
              coachMessage={coachMessage}
              onExportPress={onExportPress}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}

