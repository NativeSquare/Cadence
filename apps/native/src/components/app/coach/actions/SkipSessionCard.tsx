/**
 * SkipSessionCard
 *
 * Renders a proposal to skip a session, with reason and optional alternative.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import { getSessionCategory } from "@/lib/design-tokens";
import { ActionCardWrapper } from "./ActionCardWrapper";
import { ActionButtons } from "./ActionButtons";
import { useActionCardState } from "./useActionCardState";
import type { SkipProposal, ActionCardProps } from "./types";

interface SkipSessionCardProps extends Omit<ActionCardProps, "phase" | "onAccept" | "onReject"> {
  proposal: SkipProposal;
  executeMutation: () => Promise<{ success: boolean; error?: string }>;
  onAccepted: () => void;
  onRejected: () => void;
}

export function SkipSessionCard({
  toolCallId,
  proposal,
  executeMutation,
  onAccepted,
  onRejected,
}: SkipSessionCardProps) {
  const { phase, errorMessage, accept, reject, retry } = useActionCardState();

  const summary = `${proposal.sessionName} on ${proposal.dayOfWeek} skipped`;

  const handleAccept = () => {
    accept(executeMutation).then(() => onAccepted());
  };

  const handleReject = () => {
    reject();
    onRejected();
  };

  const handleRetry = () => {
    retry(executeMutation).then(() => onAccepted());
  };

  const sessionColor =
    SESSION_TYPE_COLORS[getSessionCategory(proposal.sessionType)] ?? COLORS.ora;

  return (
    <ActionCardWrapper
      phase={phase}
      title="Skip Session"
      summary={summary}
      errorMessage={errorMessage}
    >
      <View style={{ padding: 14, gap: 14 }}>
        {/* Session info */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: sessionColor,
            }}
          />
          <Text style={{ color: LIGHT_THEME.wText, fontSize: 15, fontWeight: "600" }}>
            {proposal.sessionName}
          </Text>
          <Text style={{ color: LIGHT_THEME.wMute, fontSize: 13 }}>
            {proposal.dayOfWeek}, {proposal.date}
          </Text>
          <Text style={{ color: LIGHT_THEME.wMute, fontSize: 13 }}>{proposal.duration}</Text>
        </View>

        {/* Reason */}
        <View
          style={{
            backgroundColor: "rgba(255,149,0,0.06)",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13, lineHeight: 18 }}>
            {proposal.reason}
          </Text>
        </View>

        {/* Alternative suggestion */}
        {proposal.alternative && (
          <View
            style={{
              backgroundColor: "rgba(74,222,128,0.06)",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: LIGHT_THEME.wSub, fontSize: 12, fontWeight: "500", marginBottom: 2 }}>
              Alternative:
            </Text>
            <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13, lineHeight: 18 }}>
              {proposal.alternative}
            </Text>
          </View>
        )}
      </View>

      <ActionButtons
        phase={phase}
        onAccept={handleAccept}
        onReject={handleReject}
        onRetry={handleRetry}
        acceptLabel="Skip Session"
      />
    </ActionCardWrapper>
  );
}
