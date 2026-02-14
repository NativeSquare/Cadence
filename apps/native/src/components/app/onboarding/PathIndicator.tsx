/**
 * PathIndicator - Badge showing current DATA/NO DATA path.
 *
 * Tappable in dev mode to toggle path.
 * Only visible in __DEV__ or when devMode prop is true.
 *
 * Source: Story 3.5 - Task 7 (AC#9)
 */

import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface PathIndicatorProps {
  /** Whether data path is active */
  hasData: boolean;
  /** Called when tapped (dev mode only) */
  onToggle?: () => void;
  /** Force show in production (default: false) */
  forceShow?: boolean;
  /** Test ID for visual regression */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PathIndicator({
  hasData,
  onToggle,
  forceShow = false,
  testID,
}: PathIndicatorProps) {
  // Only show in dev mode or when forced
  const shouldShow = __DEV__ || forceShow;
  if (!shouldShow) return null;

  const label = hasData ? "▲ DATA" : "◇ NO DATA";
  const backgroundColor = hasData ? COLORS.limeDim : COLORS.oraDim;
  const borderColor = hasData
    ? "rgba(200,255,0,0.3)"
    : "rgba(255,138,0,0.3)";
  const textColor = hasData ? COLORS.lime : COLORS.ora;

  const content = (
    <View
      style={[
        styles.badge,
        { backgroundColor, borderColor },
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );

  if (onToggle) {
    return (
      <Pressable
        onPress={onToggle}
        style={styles.container}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {content}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 54, // Below status bar
    right: 16,
    zIndex: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  label: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
