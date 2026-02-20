/**
 * ChatMessage - Message bubble for coach and user messages
 * Reference: cadence-full-v9.jsx CoachTab messages (lines 341-352)
 *
 * Styles from prototype:
 * - Coach bubble: white bg (w1), left-aligned, 18px rounded with 6px bottom-left
 *   borderRadius: "18px 18px 18px 6px"
 * - User bubble: dark bg (wText), right-aligned, 18px rounded with 6px bottom-right
 *   borderRadius: "18px 18px 6px 18px"
 *
 * Font specifications:
 * - Coach badge: fontSize:10, fontWeight:600, color:T.wMute
 * - Message text: fontSize:14, lineHeight:1.55
 * - Coach text color: T.wText
 * - User text color: T.w1
 *
 * Source: Story 10.3 - AC#1, AC#3, Task 3
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeIn } from "react-native-reanimated";

import type { ChatMessageProps } from "./types";

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Coach badge with status dot
 * Reference: prototype line 347
 */
function CoachBadge() {
  return (
    <View className="flex-row items-center gap-1.5 mb-1.5">
      {/* Status dot - 5px lime */}
      <View className="w-[5px] h-[5px] rounded-full bg-lime" />
      {/* Badge text - 10px, weight 600 */}
      <Text className="text-[10px] font-coach-semibold text-wMute">Coach</Text>
    </View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ChatMessage component
 *
 * Renders a chat message bubble with appropriate styling based on sender.
 * Uses the msgIn animation for entry: translateY(10px) scale(0.97) -> normal
 */
export function ChatMessage({ message, isCoach }: ChatMessageProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className={`flex-row mb-2.5 ${isCoach ? "justify-start" : "justify-end"}`}
    >
      <View
        className={`max-w-[82%] px-4 py-3.5 ${
          isCoach
            ? "bg-w1 border border-wBrd"
            : "bg-wText"
        }`}
        style={{
          // Coach: 18px top corners, 6px bottom-left
          // User: 18px top corners, 6px bottom-right
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: isCoach ? 6 : 18,
          borderBottomRightRadius: isCoach ? 18 : 6,
        }}
      >
        {/* Coach badge only for assistant messages */}
        {isCoach && <CoachBadge />}

        {/* Message text - 14px, lineHeight 1.55 */}
        <Text
          className={`text-[14px] font-coach ${isCoach ? "text-wText" : "text-w1"}`}
          style={{ lineHeight: 14 * 1.55 }}
        >
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}
