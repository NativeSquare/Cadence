/**
 * RescheduleWorkoutCard
 *
 * Renders a proposal to move a workout from one date to another.
 * Shows current vs proposed date with workout details.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, WORKOUT_CATEGORY_COLORS } from "@/lib/design-tokens";
import { getWorkoutCategory } from "@/lib/design-tokens";
import { ArrowRight } from "lucide-react-native";
import { ActionCardWrapper } from "./ActionCardWrapper";
import { ActionButtons } from "./ActionButtons";
import { useActionCardState } from "./useActionCardState";
import type { RescheduleProposal, ActionCardProps } from "./types";

interface RescheduleWorkoutCardProps extends Omit<ActionCardProps, "phase" | "onAccept" | "onReject"> {
  proposal: RescheduleProposal;
  /** Execute the reschedule mutation — called when user accepts */
  executeMutation: () => Promise<{ success: boolean; error?: string }>;
  /** Called after successful accept */
  onAccepted: () => void;
  /** Called after reject */
  onRejected: () => void;
}

export function RescheduleWorkoutCard({
  toolCallId,
  proposal,
  executeMutation,
  onAccepted,
  onRejected,
}: RescheduleWorkoutCardProps) {
  const { phase, errorMessage, accept, reject, retry } = useActionCardState();

  const workoutColor =
    WORKOUT_CATEGORY_COLORS[getWorkoutCategory(proposal.workoutType)] ?? COLORS.ora;

  const summary = `${proposal.workoutName} moved to ${proposal.proposedDayOfWeek}, ${proposal.proposedDate}`;

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
      title="Schedule Change"
      summary={summary}
      errorMessage={errorMessage}
    >
      {/* Content: Current → Proposed */}
      <View style={{ padding: 14, gap: 14 }}>
        {/* Workout chip */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: workoutColor,
            }}
          />
          <Text style={{ color: LIGHT_THEME.wText, fontSize: 15, fontWeight: "600" }}>
            {proposal.workoutName}
          </Text>
          <Text style={{ color: LIGHT_THEME.wMute, fontSize: 13 }}>{proposal.duration}</Text>
        </View>

        {/* Date change visualization */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {/* Current date */}
          <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <Text style={{ color: LIGHT_THEME.wMute, fontSize: 11, textTransform: "uppercase" }}>
              Current
            </Text>
            <Text style={{ color: LIGHT_THEME.wText, fontSize: 16, fontWeight: "600" }}>
              {proposal.currentDayOfWeek}
            </Text>
            <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>{proposal.currentDate}</Text>
          </View>

          {/* Arrow */}
          <ArrowRight size={20} color={COLORS.ora} />

          {/* Proposed date */}
          <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <Text style={{ color: LIGHT_THEME.wMute, fontSize: 11, textTransform: "uppercase" }}>
              Proposed
            </Text>
            <Text style={{ color: COLORS.ora, fontSize: 16, fontWeight: "600" }}>
              {proposal.proposedDayOfWeek}
            </Text>
            <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>{proposal.proposedDate}</Text>
          </View>
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

        {/* Impact note (if any) */}
        {proposal.impact && (
          <Text style={{ color: LIGHT_THEME.wMute, fontSize: 12, lineHeight: 16 }}>
            {proposal.impact}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <ActionButtons
        phase={phase}
        onAccept={handleAccept}
        onReject={handleReject}
        onRetry={handleRetry}
      />
    </ActionCardWrapper>
  );
}
