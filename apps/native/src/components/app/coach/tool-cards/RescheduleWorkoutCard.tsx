/**
 * Approval card for the `rescheduleWorkout` writing tool.
 *
 * Renders: workout name + type, then a "current date → new date" diff row.
 * Fetches the current workout via useQuery so the user sees what's moving.
 */

import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react-native";
import { View } from "react-native";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { ProposalCard } from "./ProposalCard";
import { formatDate } from "./format";
import type { ToolCardProps } from "./types";

interface RescheduleInput {
  workoutId: string;
  date: string;
}

export function RescheduleWorkoutCard(props: ToolCardProps) {
  const input = props.input as RescheduleInput | undefined;
  const result = useQuery(
    api.agoge.workouts.getWorkout,
    input?.workoutId ? { workoutId: input.workoutId } : "skip",
  );

  const workoutName = result?.workout?.name ?? "Workout";
  const currentDate = result?.workout?.planned?.date;
  const targetDate = input?.date;

  return (
    <ProposalCard
      title="Reschedule workout"
      state={props.state}
      errorText={props.errorText}
      approvalId={props.approvalId}
      onAccept={props.onAccept}
      onDeny={props.onDeny}
      busy={props.busy}
    >
      <View className="gap-2">
        <Text
          className="text-[14px] font-coach-semibold text-wText"
          style={{ lineHeight: 14 * 1.4 }}
        >
          {workoutName}
        </Text>
        <View className="flex-row items-center gap-2">
          <DateChip iso={currentDate} muted />
          <ArrowRight size={14} color="#888" />
          <DateChip iso={targetDate} />
        </View>
      </View>
    </ProposalCard>
  );
}

function DateChip({ iso, muted }: { iso?: string; muted?: boolean }) {
  return (
    <View
      className={`px-2.5 py-1 rounded-md ${muted ? "bg-w2" : "bg-lime/15"}`}
    >
      <Text
        className={`text-[12px] font-coach-medium ${
          muted ? "text-wMute" : "text-wText"
        }`}
      >
        {iso ? formatDate(iso) : "—"}
      </Text>
    </View>
  );
}
