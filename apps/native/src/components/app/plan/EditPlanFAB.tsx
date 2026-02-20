/**
 * EditPlanFAB - Floating action button for editing the plan
 * Reference: cadence-full-v9.jsx EditPlanFAB component (lines 88-97)
 *
 * Features:
 * - Floating action button with fabIn animation
 * - Pencil icon + "Edit Plan" text
 * - Navigation stub to plan editing flow
 */

import { Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeInDown, BounceIn } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

/**
 * Pencil icon for the FAB
 * Reference: prototype line 92
 */
function PencilIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M11.3 1.5a1.6 1.6 0 012.3 2.3L5.3 12l-3.3.8.8-3.3z"
        stroke={COLORS.lime}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * EditPlanFAB - Floating action button component
 * Positioned at bottom-right of the screen
 */
export function EditPlanFAB() {
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    // TODO: Navigate to plan editing flow
    console.log("Edit plan pressed");
  };

  return (
    <Animated.View
      entering={BounceIn.delay(600).duration(400)}
      style={{
        position: "absolute",
        bottom: 78 + insets.bottom,
        right: 16,
        zIndex: 180,
      }}
    >
      <Pressable
        onPress={handlePress}
        className="flex-row items-center gap-2 py-3 px-5 rounded-2xl"
        style={{
          backgroundColor: LIGHT_THEME.wText,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <PencilIcon />
        <Text className="text-sm font-coach-semibold text-w1">Edit Plan</Text>
      </Pressable>
    </Animated.View>
  );
}
