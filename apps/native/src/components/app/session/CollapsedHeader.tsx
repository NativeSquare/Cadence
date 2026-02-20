/**
 * CollapsedHeader - Compact header shown on scroll
 * Reference: cadence-full-v10.jsx lines 262-271
 *
 * Features:
 * - Fade-in based on scroll position threshold
 * - Dark background with blur effect simulation
 * - Compact zone badge and title
 */

import { View, Pressable, StyleSheet } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { GRAYS, SURFACES, FONT_WEIGHTS } from "@/lib/design-tokens";
import type { SessionDetailData } from "./types";
import type { ViewStyle } from "react-native";

export interface CollapsedHeaderProps {
  /** Session data */
  session: SessionDetailData;
  /** Computed session color */
  sessionColor: string;
  /** Animated style for fade in/out */
  animatedStyle: AnimatedStyle<ViewStyle>;
  /** Back button callback (optional, uses navigation if not provided) */
  onBack?: () => void;
}

export function CollapsedHeader({
  session,
  sessionColor,
  animatedStyle,
  onBack,
}: CollapsedHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 90,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <View className="flex-row items-center gap-3 px-6 pb-3.5">
          {/* Back button */}
          {onBack && (
            <Pressable onPress={onBack} hitSlop={8} className="p-1">
              <ChevronLeft size={20} color={GRAYS.g2} strokeWidth={2} />
            </Pressable>
          )}

          {/* Title */}
          <View className="flex-1">
            <Text className="text-base font-coach-bold text-g1">
              {session.type}
            </Text>
          </View>

          {/* Zone badge - smaller variant */}
          <View
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 8,
              backgroundColor: `${sessionColor}22`,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: FONT_WEIGHTS.bold,
                color: sessionColor,
              }}
            >
              {session.zone}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "rgba(0,0,0,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: SURFACES.brd,
  },
});
