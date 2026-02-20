/**
 * DebriefHeader - Dark hero header with completion badge and stats
 * Reference: cadence-full-v10.jsx DebriefScreen header (lines 694-721)
 *
 * Features:
 * - Completion badge (lime circle with checkmark)
 * - Session title and metadata
 * - Stats row with Time, Distance, Avg Pace cards
 * - springUp staggered animation for stats
 */

import { View } from "react-native";
import Animated, {
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

export interface StatItem {
  label: string;
  value: string;
  unit?: string;
}

export interface DebriefHeaderProps {
  session: {
    type: string;
    zone: string;
    km: number;
  };
  stats: StatItem[];
  insetTop: number;
}

export function DebriefHeader({ session, stats, insetTop }: DebriefHeaderProps) {
  return (
    <View
      className="bg-black px-6 pb-7"
      style={{ paddingTop: insetTop + 12 }}
    >
      {/* Completion badge */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="flex-row items-center gap-2 mb-[14px]"
      >
        <View
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{ backgroundColor: COLORS.lime }}
        >
          <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <Path
              d="M3 8l3.5 3.5L13 4"
              stroke={COLORS.black}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text
          className="text-[15px] font-coach-semibold"
          style={{ color: COLORS.lime }}
        >
          Session Complete
        </Text>
      </Animated.View>

      {/* Session title */}
      <Animated.Text
        entering={FadeInUp.delay(100).duration(400)}
        className="text-[30px] font-coach-extrabold leading-tight"
        style={{ color: GRAYS.g1, letterSpacing: -0.04 * 30 }}
      >
        {session.type}
      </Animated.Text>

      {/* Session metadata */}
      <Animated.Text
        entering={FadeInUp.delay(150).duration(400)}
        className="text-[14px] font-coach mt-[6px]"
        style={{ color: GRAYS.g3 }}
      >
        Today · {session.zone} · {session.km} km
      </Animated.Text>

      {/* Stats row */}
      <View className="flex-row gap-2 mt-[18px]">
        {stats.map((stat, i) => (
          <Animated.View
            key={stat.label}
            entering={FadeInUp.delay(200 + i * 60).duration(400).springify()}
            className="flex-1 py-3 px-[10px] rounded-[14px] items-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: SURFACES.brd,
            }}
          >
            <Text
              className="text-[10px] font-coach-medium uppercase mb-1"
              style={{ color: GRAYS.g4, letterSpacing: 0.04 * 10 }}
            >
              {stat.label}
            </Text>
            <View className="flex-row items-baseline gap-[2px]">
              <Text
                className="text-[18px] font-coach-bold"
                style={{ color: GRAYS.g1 }}
              >
                {stat.value}
              </Text>
              {stat.unit && (
                <Text
                  className="text-[11px] font-coach-medium"
                  style={{ color: GRAYS.g4 }}
                >
                  {stat.unit}
                </Text>
              )}
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
