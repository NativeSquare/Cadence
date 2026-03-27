/**
 * ModifySessionCard
 *
 * Renders a proposal to change session details with a diff view
 * showing old values (strikethrough) → new values.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { ArrowRight } from "lucide-react-native";
import { ActionCardWrapper } from "./ActionCardWrapper";
import { ActionButtons } from "./ActionButtons";
import { useActionCardState } from "./useActionCardState";
import type { ModifyProposal, ActionCardProps } from "./types";

interface ModifySessionCardProps extends Omit<ActionCardProps, "phase" | "onAccept" | "onReject"> {
  proposal: ModifyProposal;
  executeMutation: () => Promise<{ success: boolean; error?: string }>;
  onAccepted: () => void;
  onRejected: () => void;
}

export function ModifySessionCard({
  toolCallId,
  proposal,
  executeMutation,
  onAccepted,
  onRejected,
}: ModifySessionCardProps) {
  const { phase, errorMessage, accept, reject, retry } = useActionCardState();

  const changeLabels = proposal.changes.map((c) => c.fieldLabel).join(", ");
  const summary = `${proposal.sessionName} updated: ${changeLabels}`;

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

  return (
    <ActionCardWrapper
      phase={phase}
      title="Session Update"
      summary={summary}
      errorMessage={errorMessage}
    >
      <View style={{ padding: 14, gap: 14 }}>
        {/* Session name */}
        <Text style={{ color: LIGHT_THEME.wText, fontSize: 15, fontWeight: "600" }}>
          {proposal.sessionName}
        </Text>

        {/* Diff view */}
        <View style={{ gap: 8 }}>
          {proposal.changes.map((change, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 6,
                borderBottomWidth: i < proposal.changes.length - 1 ? 1 : 0,
                borderBottomColor: LIGHT_THEME.wBrd,
              }}
            >
              {/* Field label */}
              <Text
                style={{
                  width: 80,
                  color: LIGHT_THEME.wMute,
                  fontSize: 12,
                  fontWeight: "500",
                }}
              >
                {change.fieldLabel}
              </Text>

              {/* Old value */}
              <Text
                style={{
                  flex: 1,
                  color: COLORS.red,
                  fontSize: 14,
                  opacity: 0.6,
                  textDecorationLine: "line-through",
                }}
              >
                {change.oldValue}
              </Text>

              <ArrowRight size={14} color={LIGHT_THEME.wMute} style={{ marginHorizontal: 6 }} />

              {/* New value */}
              <Text
                style={{
                  flex: 1,
                  color: COLORS.grn,
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                {change.newValue}
              </Text>
            </View>
          ))}
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
      </View>

      <ActionButtons
        phase={phase}
        onAccept={handleAccept}
        onReject={handleReject}
        onRetry={handleRetry}
        acceptLabel="Accept Changes"
      />
    </ActionCardWrapper>
  );
}
