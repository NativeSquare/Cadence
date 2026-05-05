/**
 * Generic fallback card for any writing tool without a specific renderer.
 *
 * Shown when a tool emits `state: "approval-requested"` and no entry exists
 * for `toolName` in the tool-cards registry. Renders the tool name + raw
 * JSON input + Accept/Deny buttons. After resolution it shows a compact
 * "Accepted" / "Denied" status pill.
 */

import { View, Image, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Check, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import type { ToolCardProps } from "./types";

const CADENCE_ICON = require("../../../../../assets/icons/ios-icon.png");

export function PendingActionCard({
  toolName,
  state,
  input,
  errorText,
  approvalId,
  onAccept,
  onDeny,
  busy,
}: ToolCardProps) {
  const isAwaiting = state === "approval-requested" && !!approvalId;
  const isResolved =
    state === "approval-responded" ||
    state === "output-available" ||
    state === "output-error";

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="flex-row justify-start mb-2.5"
    >
      <View className="w-7 h-7 rounded-full overflow-hidden mr-2 mt-1">
        <Image source={CADENCE_ICON} className="w-7 h-7" />
      </View>

      <View
        className="max-w-[85%] px-4 py-3.5 bg-w1"
        style={{
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
        }}
      >
        <View className="flex-row items-center gap-1.5 mb-2">
          <View className="w-[5px] h-[5px] rounded-full bg-lime" />
          <Text className="text-[10px] font-coach-semibold text-primary">
            Coach proposal
          </Text>
        </View>

        <Text
          className="text-[13px] font-coach-semibold text-wText mb-1"
          style={{ lineHeight: 13 * 1.4 }}
        >
          {toolName}
        </Text>

        <Text
          className="text-[12px] font-coach text-wMute mb-3"
          style={{ lineHeight: 12 * 1.5 }}
        >
          {JSON.stringify(input, null, 2)}
        </Text>

        {errorText ? (
          <Text className="text-[12px] font-coach text-red-500 mb-2">
            {errorText}
          </Text>
        ) : null}

        {isAwaiting ? (
          <View className="flex-row gap-2">
            <Pressable
              disabled={busy}
              onPress={onAccept}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-wText py-2.5 rounded-xl active:opacity-80"
              style={{ opacity: busy ? 0.5 : 1 }}
            >
              <Check size={13} color="#ffffff" />
              <Text className="text-[13px] font-coach-medium text-w1">
                Accept
              </Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={onDeny}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-w2 border border-wMute/30 py-2.5 rounded-xl active:opacity-80"
              style={{ opacity: busy ? 0.5 : 1 }}
            >
              <X size={13} color="#1a1a1a" />
              <Text className="text-[13px] font-coach-medium text-wText">
                Deny
              </Text>
            </Pressable>
          </View>
        ) : isResolved ? (
          <Text className="text-[11px] font-coach-medium text-wMute">
            {state === "output-error" ? "Error" : "Resolved"}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}
