/**
 * SessionPreview - Small card for upcoming sessions
 * Reference: cadence-full-v9.jsx SmallCard component (lines 99-114)
 *
 * Features:
 * - Compact card with side accent bar
 * - Session type, zone, and distance
 * - Completion checkmark for done sessions
 * - slideIn animation with staggered delay
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeInRight } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { DAYS, DATES, type SessionData } from "./types";
import { getSessionColor } from "./utils";

interface SessionPreviewProps {
  /** Session data */
  session: SessionData & { dayIdx: number };
  /** Day index for date display */
  dayIdx: number;
  /** Animation delay in seconds */
  delay?: number;
}

/**
 * Checkmark icon for completed sessions
 * Reference: prototype line 107
 */
function CheckmarkIcon() {
  return (
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
  );
}

/**
 * SessionPreview component
 * Small card showing upcoming session preview
 */
export function SessionPreview({
  session,
  dayIdx,
  delay = 0,
}: SessionPreviewProps) {
  const isRest = session.intensity === "rest";
  const isDone = session.done;
  const accentColor = isDone ? COLORS.lime : getSessionColor(session);

  // Calculate animation delay in ms
  const animationDelay = delay * 1000;

  return (
    <Animated.View
      entering={FadeInRight.delay(animationDelay).duration(350)}
      className="flex-row rounded-2xl bg-w1 border border-wBrd overflow-hidden mb-1.5"
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
        {/* Top row: Date and checkmark */}
        <View className="flex-row items-center justify-between mb-0.5">
          <Text className="text-xs font-coach-medium text-wMute">
            {DAYS[dayIdx]}, Feb {DATES[dayIdx]}
            {!isRest && ` · ${session.dur}`}
          </Text>

          {isDone && (
            <View
              className="w-5.5 h-5.5 rounded-full items-center justify-center"
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: LIGHT_THEME.wText,
              }}
            >
              <CheckmarkIcon />
            </View>
          )}
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
    </Animated.View>
  );
}
