/**
 * Approval card for the `deleteWorkout` writing tool.
 *
 * Shows the workout name + planned/actual date in a destructive-style row so
 * the user understands exactly what's being deleted before confirming.
 */

import { useQuery } from "convex/react";
import { Trash2 } from "lucide-react-native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { workoutTypeLabel } from "@/components/app/workout/workout-helpers";
import { ProposalCard } from "./ProposalCard";
import { formatDate } from "./format";
import type { ToolCardProps } from "./types";

interface DeleteInput {
  workoutId: string;
}

export function DeleteWorkoutCard(props: ToolCardProps) {
  const { t } = useTranslation();
  const input = props.input as DeleteInput | undefined;
  const result = useQuery(
    api.agoge.workouts.getWorkout,
    input?.workoutId ? { workoutId: input.workoutId } : "skip",
  );

  const workout = result?.workout;
  const date = workout?.planned?.date ?? workout?.actual?.date;

  return (
    <ProposalCard
      title={t("coach.tools.card.deleteWorkoutTitle")}
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
            {workout?.name ?? t("coach.tools.card.workoutFallback")}
          </Text>
          <Text className="text-[12px] font-coach text-wMute">
            {workout
              ? workoutTypeLabel(t, workout.type)
              : t("coach.tools.card.loading")}
            {date ? ` · ${formatDate(date)}` : ""}
          </Text>
        </View>
      </View>
    </ProposalCard>
  );
}
