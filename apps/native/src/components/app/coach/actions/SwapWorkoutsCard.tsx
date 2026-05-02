/**
 * SwapWorkoutsCard
 *
 * Renders a proposal to swap two workouts' dates.
 * Shows both workouts side by side with a swap indicator.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, WORKOUT_CATEGORY_COLORS } from "@/lib/design-tokens";
import { getWorkoutCategory } from "@/lib/design-tokens";
import { ArrowLeftRight } from "lucide-react-native";
import { ActionCardWrapper } from "./ActionCardWrapper";
import { ActionButtons } from "./ActionButtons";
import { useActionCardState } from "./useActionCardState";
import type { SwapProposal, ActionCardProps } from "./types";

interface SwapWorkoutsCardProps extends Omit<ActionCardProps, "phase" | "onAccept" | "onReject"> {
  proposal: SwapProposal;
  executeMutation: () => Promise<{ success: boolean; error?: string }>;
  onAccepted: () => void;
  onRejected: () => void;
}

function WorkoutChip({
  name,
  workoutType,
  dayOfWeek,
  date,
  duration,
}: {
  name: string;
  workoutType: string;
  dayOfWeek: string;
  date: string;
  duration: string;
}) {
  const color = WORKOUT_CATEGORY_COLORS[getWorkoutCategory(workoutType)] ?? COLORS.ora;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: 4,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
        <Text style={{ color: LIGHT_THEME.wText, fontSize: 14, fontWeight: "600" }}>{name}</Text>
      </View>
      <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>{dayOfWeek}</Text>
      <Text style={{ color: LIGHT_THEME.wMute, fontSize: 12 }}>{date}</Text>
      <Text style={{ color: LIGHT_THEME.wMute, fontSize: 11 }}>{duration}</Text>
    </View>
  );
}

export function SwapWorkoutsCard({
  toolCallId,
  proposal,
  executeMutation,
  onAccepted,
  onRejected,
}: SwapWorkoutsCardProps) {
  const { phase, errorMessage, accept, reject, retry } = useActionCardState();

  const summary = `Swapped ${proposal.workoutA.workoutName} (${proposal.workoutA.dayOfWeek}) with ${proposal.workoutB.workoutName} (${proposal.workoutB.dayOfWeek})`;

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
      title="Workout Swap"
      summary={summary}
      errorMessage={errorMessage}
    >
      <View style={{ padding: 14, gap: 14 }}>
        {/* Two workout chips with swap icon */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <WorkoutChip
            name={proposal.workoutA.workoutName}
            workoutType={proposal.workoutA.workoutType}
            dayOfWeek={proposal.workoutA.dayOfWeek}
            date={proposal.workoutA.date}
            duration={proposal.workoutA.duration}
          />

          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(255,149,0,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeftRight size={16} color={COLORS.ora} />
          </View>

          <WorkoutChip
            name={proposal.workoutB.workoutName}
            workoutType={proposal.workoutB.workoutType}
            dayOfWeek={proposal.workoutB.dayOfWeek}
            date={proposal.workoutB.date}
            duration={proposal.workoutB.duration}
          />
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
        acceptLabel="Accept Swap"
      />
    </ActionCardWrapper>
  );
}
