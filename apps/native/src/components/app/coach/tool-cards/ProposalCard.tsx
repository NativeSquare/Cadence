/**
 * Shared chrome for every Coach writing-tool card.
 *
 * Writing tools now run immediately (no Accept/Deny approval flow), so each
 * card is a read-only summary of what the coach just did: title at the top,
 * tool-specific body, optional error text below if the call failed.
 *
 * The "applied" footer surfaces a one-line status — "applied" when the call
 * succeeded, "failed" when it threw. Future undo wiring will plug a Revert
 * button into this same footer.
 */

import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import type { ToolCardState } from "./types";

interface ProposalCardProps {
  title: string;
  state: ToolCardState;
  errorText?: string;
  children: ReactNode;
}

export function ProposalCard({
  title,
  state,
  errorText,
  children,
}: ProposalCardProps) {
  const { t } = useTranslation();
  const isError = state === "output-error" || !!errorText;
  const isApplied = state === "output-available" && !errorText;

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
          className="px-4 py-2"
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Text className="text-[11px] font-coach-medium text-wMute">
            {isError
              ? t("coach.tools.actions.failed")
              : isApplied
                ? t("coach.tools.actions.applied")
                : t("coach.tools.actions.applying")}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
