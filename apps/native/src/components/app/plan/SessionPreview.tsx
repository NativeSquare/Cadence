/**
 * SessionPreview - Small card for upcoming sessions
 *
 * Features:
 * - Compact card with side accent bar
 * - Session type, zone, and distance
 * - Sync-aware status indicator with colored icon circles
 * - slideIn animation with staggered delay
 * - Tappable to navigate to session detail
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { DAYS, DATES, type SessionData } from "./types";
import { getSessionColor, getSyncStatusColor } from "./utils";

interface SessionPreviewProps {
  /** Session data */
  session: SessionData & { dayIdx: number };
  /** Day index for date display */
  dayIdx: number;
  /** Animation delay in seconds */
  delay?: number;
  /** Optional callback when tapped (overrides default navigation) */
  onPress?: () => void;
}

/**
 * Spinning sync arrows for syncing state (compact version)
 */
function SpinningSyncIcon({ color }: { color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
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

/**
 * Sync-aware status indicator — colored circles with white icons
 */
function SessionStatusIndicator({ session }: { session: SessionData }) {
  const isRest = session.intensity === "rest";
  const syncStatus = session.syncStatus;

  if (isRest) return null;

  // Sync-aware icons: colored circle with white icon inside
  if (syncStatus && syncStatus !== "planned") {
    const color = getSyncStatusColor(syncStatus);

    if (syncStatus === "syncing") {
      return (
        <View style={{ width: 22, height: 22 }} className="items-center justify-center">
          <SpinningSyncIcon color={color} />
        </View>
      );
    }

    // Solid colored circle with white icon
    return (
      <View
        className="items-center justify-center"
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: color,
        }}
      >
        {/* Exported = single tick (export succeeded) */}
        {syncStatus === "exported" && (
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
            <Path d="M4 12.5L9.5 18L20 6" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
        {/* Synced = double tick (data received + confirmed, dark on lime) */}
        {syncStatus === "synced" && (
          <Svg width={13} height={11} viewBox="0 0 28 24" fill="none">
            <Path d="M2 12.5L7.5 18L18 6" stroke="#1A1A1A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M10 12.5L15.5 18L26 6" stroke="#1A1A1A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
        {/* Failed = exclamation */}
        {syncStatus === "failed" && (
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
            <Path d="M12 6V14" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
            <Path d="M12 18V18.01" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
          </Svg>
        )}
      </View>
    );
  }

  // Fallback: legacy done/not-done
  if (session.done) {
    return (
      <View
        className="items-center justify-center"
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: LIGHT_THEME.wText,
        }}
      >
        <Svg width={11} height={11} viewBox="0 0 12 12">
          <Path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke={COLORS.lime}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  return <ChevronRight size={14} color={LIGHT_THEME.wMute} strokeWidth={1.5} />;
}

/**
 * SessionPreview component
 */
export function SessionPreview({
  session,
  dayIdx,
  delay = 0,
  onPress,
}: SessionPreviewProps) {
  const router = useRouter();
  const isRest = session.intensity === "rest";
  const isDone = session.done || session.syncStatus === "synced";
  const accentColor = isDone ? COLORS.lime : getSessionColor(session);

  const animationDelay = delay * 1000;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/(app)/session",
        params: { dayIdx: String(dayIdx) },
      });
    }
  };

  return (
    <Animated.View entering={FadeInRight.delay(animationDelay).duration(350)}>
      <Pressable
        onPress={handlePress}
        className="flex-row rounded-2xl bg-w1 border border-wBrd overflow-hidden mb-1.5"
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {/* Side accent bar */}
        <View
          style={{
            width: 5,
            backgroundColor: accentColor,
            flexShrink: 0,
          }}
        />

        {/* Content */}
        <View className="flex-1 px-4 py-3.5">
          {/* Top row: Date and status indicator */}
          <View className="flex-row items-center justify-between mb-0.5">
            <Text className="text-xs font-coach-medium text-wMute">
              {DAYS[dayIdx]}, Feb {DATES[dayIdx]}
              {!isRest && ` · ${session.dur}`}
            </Text>

            <SessionStatusIndicator session={session} />
          </View>

          {/* Session type */}
          <Text className="text-[17px] font-coach-semibold text-wText">
            {session.type}
          </Text>

          {/* Session details */}
          <Text className="text-[13px] font-coach text-wSub mt-0.5">
            {isRest ? session.desc : `${session.zone} · ${session.km} km`}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
