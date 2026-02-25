/**
 * TodayCard - Main card showing today's session with coach message
 *
 * Layout order: Sync banner → Session info → Coach quote → CTA
 * When a sync status is active, the entire card is visually wrapped:
 * - Card border color matches the sync state
 * - Full-width banner at top with icon + label
 *
 * Features:
 * - Sync banner wraps the card (top banner + colored border)
 * - Session details with vertical accent bar
 * - Coach quote section with lime background
 * - "Start Session" CTA button
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
import Svg, { Polygon, Path } from "react-native-svg";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { type SessionData, type SyncStatus } from "./types";
import { getSessionColor, formatShortDate, getSyncStatusLabel, getSyncStatusColor } from "./utils";
import { useStream } from "./use-stream";

interface TodayCardProps {
  session: SessionData;
  coachMessage: string;
  onStartPress?: () => void;
}

// ─── Shared animation components ────────────────────────────────────────────

function CoachPulsingDot({ isStreaming }: { isStreaming: boolean }) {
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
  return <Animated.View style={animatedStyle} className="w-1.5 h-1.5 rounded-full bg-black" />;
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

function PlayIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Polygon points="5,3 19,12 5,21" fill={COLORS.lime} />
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
  exported: "rgba(26,26,26,0.06)",
  syncing: "rgba(255,149,0,0.10)",
  synced: "rgba(200,255,0,0.12)",
  failed: "rgba(255,90,90,0.10)",
};

/**
 * Full-width sync banner — sits at the top of the card.
 * Icon circle + label, tinted background spanning edge to edge.
 */
function SyncBanner({ session }: { session: SessionData }) {
  const { syncStatus, syncSource, syncedData } = session;
  if (!syncStatus || syncStatus === "planned") return null;

  const color = getSyncStatusColor(syncStatus);
  const label = getSyncStatusLabel(syncStatus, syncSource, syncedData);
  const bg = SYNC_BANNER_BG[syncStatus] ?? SYNC_BANNER_BG.exported;

  return (
    <View
      className="flex-row items-center gap-2.5 px-4 py-2.5"
      style={{ backgroundColor: bg }}
    >
      {syncStatus === "syncing" ? (
        <SpinningSyncIcon color={color} size={18} />
      ) : (
        <View
          style={{
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: color,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <SyncBannerIcon status={syncStatus} />
        </View>
      )}
      <Text className="text-[13px] font-coach-bold" style={{ color }}>
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

function SessionInfo({ session }: { session: SessionData }) {
  const accentColor = getSessionColor(session);
  const isRest = session.intensity === "rest";
  const dateStr = formatShortDate();

  return (
    <View className="px-4 pt-4 pb-3">
      <View className="flex-row gap-3.5">
        <View
          style={{
            width: 4, borderRadius: 2,
            backgroundColor: accentColor, alignSelf: "stretch",
          }}
        />
        <View className="flex-1">
          <Text className="text-xs font-coach-medium text-wMute">
            {dateStr} · {isRest ? "" : session.dur}
          </Text>
          <Text
            className="text-[22px] font-coach-bold text-wText mt-0.5"
            style={{ letterSpacing: -0.02 * 22, lineHeight: 26 }}
          >
            {session.type}
          </Text>
          <Text className="text-[13px] font-coach text-wSub mt-1">
            {isRest ? session.desc : `${session.zone} · ${session.km} km`}
          </Text>
          {!isRest && (
            <Text className="text-sm font-coach text-wMute mt-2" style={{ lineHeight: 21 }}>
              {session.desc}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function StartSessionCTA({ onPress }: { onPress?: () => void }) {
  return (
    <View className="px-4 pb-4">
      <Pressable
        className="py-[14px] px-5 rounded-[14px] flex-row items-center justify-center gap-2 active:scale-[0.98]"
        style={{ backgroundColor: "#1A1A1A" }}
        onPress={onPress}
      >
        <PlayIcon />
        <Text className="text-[15px] font-coach-semibold text-w1">Start Session</Text>
      </Pressable>
    </View>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function TodayCard({ session, coachMessage, onStartPress }: TodayCardProps) {
  const { displayed, done, started } = useStream(coachMessage, {
    speed: 20, delay: 800,
  });

  const isRest = session.intensity === "rest";
  const hasSyncStatus = session.syncStatus && session.syncStatus !== "planned";
  const borderColor = hasSyncStatus
    ? getSyncStatusColor(session.syncStatus!)
    : undefined;

  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wMute px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Today
      </Text>

      {/* Card — border color reflects sync state */}
      <View
        className="rounded-[20px] bg-w1 overflow-hidden"
        style={{
          borderWidth: hasSyncStatus ? 1.5 : 1,
          borderColor: borderColor ?? "rgba(0,0,0,0.06)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 16,
          elevation: 2,
        }}
      >
        {/* 0. Sync banner — full width, top of card */}
        <SyncBanner session={session} />

        {/* 1. Session info */}
        <SessionInfo session={session} />

        {/* 2. Coach quote */}
        <CoachQuote displayed={displayed} done={done} started={started} />

        {/* 3. CTA */}
        {!isRest && <StartSessionCTA onPress={onStartPress} />}
      </View>
    </View>
  );
}
