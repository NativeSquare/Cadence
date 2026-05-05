/**
 * Reusable layout for any writing-tool approval card.
 *
 * Three slots: title (top), body (children, tool-specific), footer
 * (Accept/Deny while awaiting; resolved status afterwards). Specific tool
 * cards plug their own body in here; the fallback `PendingActionCard`
 * dumps raw JSON.
 */

import type { ReactNode } from "react";
import { View, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Check, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import type { ToolCardState } from "./types";

interface ProposalCardProps {
  title: string;
  state: ToolCardState;
  errorText?: string;
  approvalId?: string;
  onAccept?: () => void;
  onDeny?: () => void;
  busy?: boolean;
  children: ReactNode;
}

export function ProposalCard({
  title,
  state,
  errorText,
  approvalId,
  onAccept,
  onDeny,
  busy,
  children,
}: ProposalCardProps) {
  const isAwaiting = state === "approval-requested" && !!approvalId;
  const isResolved =
    state === "approval-responded" ||
    state === "output-available" ||
    state === "output-error";

  return (
    <Animated.View entering={FadeIn.duration(200)} className="w-full">
      <View
        className="w-full rounded-2xl bg-w1"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.12)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 4,
        }}
      >
        <View className="px-4 pt-3.5 pb-2.5">
          <Text
            className="text-[15px] font-coach-semibold text-wText"
            style={{ lineHeight: 15 * 1.35 }}
          >
            {title}
          </Text>
        </View>

        <View
          className="px-4 py-3"
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.06)",
          }}
        >
          {children}
        </View>

        {errorText ? (
          <View className="px-4 pb-2">
            <Text className="text-[12px] font-coach text-red-500">
              {errorText}
            </Text>
          </View>
        ) : null}

        <View
          className="px-3 py-2.5"
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.06)",
          }}
        >
          {isAwaiting ? (
            <View className="flex-row gap-2">
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
            </View>
          ) : isResolved ? (
            <View className="px-1 py-1">
              <Text className="text-[11px] font-coach-medium text-wMute">
                {state === "output-error" ? "Error" : "Resolved"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}
