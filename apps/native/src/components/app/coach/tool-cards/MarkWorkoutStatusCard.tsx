/**
 * Card for the `markWorkoutStatus` writing tool.
 *
 * Shows the workout name and the status transition (planned → completed, etc.),
 * plus the distance/duration of the recorded actual face when present.
 */

import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react-native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { workoutStatusLabel } from "@/components/app/workout/workout-helpers";
import { ProposalCard } from "./ProposalCard";
import { formatDistance, formatDuration } from "./format";
import type { ToolCardProps } from "./types";

interface ActualFace {
  date?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  avgHr?: number;
  notes?: string;
}

interface MarkStatusInput {
  workoutId: string;
  status: "completed" | "missed";
  actual?: ActualFace;
}

export function MarkWorkoutStatusCard(props: ToolCardProps) {
  const { t } = useTranslation();
  const input = props.input as MarkStatusInput | undefined;
  const result = useQuery(
    api.agoge.workouts.getWorkout,
    input?.workoutId ? { workoutId: input.workoutId } : "skip",
  );
  const workout = result?.workout;

  return (
    <ProposalCard
      title={t("coach.tools.card.markWorkoutStatusTitle")}
      state={props.state}
      errorText={props.errorText}
    >
      <View className="gap-2">
        <Text
          className="text-[14px] font-coach-semibold text-wText"
          style={{ lineHeight: 14 * 1.4 }}
        >
          {workout?.name ?? t("coach.tools.card.workoutFallback")}
        </Text>
        <View className="flex-row items-center gap-2">
          <StatusChip
            label={workout ? workoutStatusLabel(t, workout.status) : "—"}
            muted
          />
          <ArrowRight size={14} color="#888" />
          <StatusChip
            label={input ? workoutStatusLabel(t, input.status) : "—"}
          />
        </View>
        {input?.actual ? (
          <View className="gap-1 pt-1">
            <ActualRow
              label={t("coach.tools.card.rows.distance")}
              value={formatDistance(input.actual.distanceMeters)}
            />
            <ActualRow
              label={t("coach.tools.card.rows.duration")}
              value={formatDuration(input.actual.durationSeconds)}
            />
          </View>
        ) : null}
      </View>
    </ProposalCard>
  );
}

function StatusChip({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <View
      className={`px-2.5 py-1 rounded-md ${muted ? "bg-w2" : "bg-lime/15"}`}
    >
      <Text
        className={`text-[12px] font-coach-medium ${
          muted ? "text-wMute" : "text-wText"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

function ActualRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center gap-2">
      <Text
        className="text-[11px] font-coach text-wMute"
        style={{ minWidth: 70 }}
      >
        {label}
      </Text>
      <Text className="text-[12px] font-coach-medium text-wText">{value}</Text>
    </View>
  );
}
