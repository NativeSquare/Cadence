/**
 * Approval card for the `deleteWorkout` writing tool.
 *
 * Shows the workout name + planned/actual date in a destructive-style row so
 * the user understands exactly what's being deleted before confirming.
 */

import { useQuery } from "convex/react";
import { Trash2 } from "lucide-react-native";
import { View } from "react-native";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { ProposalCard } from "./ProposalCard";
import { formatDate, humanize } from "./format";
import type { ToolCardProps } from "./types";

interface DeleteInput {
  workoutId: string;
}

export function DeleteWorkoutCard(props: ToolCardProps) {
  const input = props.input as DeleteInput | undefined;
  const result = useQuery(
    api.agoge.workouts.getWorkout,
    input?.workoutId ? { workoutId: input.workoutId } : "skip",
  );

  const workout = result?.workout;
  const date = workout?.planned?.date ?? workout?.actual?.date;

  return (
    <ProposalCard
      title="Delete workout"
      state={props.state}
      errorText={props.errorText}
      approvalId={props.approvalId}
      onAccept={props.onAccept}
      onDeny={props.onDeny}
      busy={props.busy}
    >
      <View className="flex-row items-center gap-2.5">
        <View className="w-7 h-7 rounded-full bg-red-500/10 items-center justify-center">
          <Trash2 size={14} color="#ef4444" />
        </View>
        <View className="flex-1">
          <Text
            className="text-[14px] font-coach-semibold text-wText"
            style={{ lineHeight: 14 * 1.4 }}
          >
            {workout?.name ?? "Workout"}
          </Text>
          <Text className="text-[12px] font-coach text-wMute">
            {workout ? humanize(workout.type) : "Loading…"}
            {date ? ` · ${formatDate(date)}` : ""}
          </Text>
        </View>
      </View>
    </ProposalCard>
  );
}
