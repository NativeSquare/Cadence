/**
 * Approval card for the `createWorkout` writing tool.
 *
 * Renders a compact summary of the proposed workout — name, type/status,
 * planned date, and any planned-face metrics (distance, duration, pace, HR).
 * Pure render (no useQuery) since the entity doesn't exist yet.
 */

import { View } from "react-native";
import { useTranslation } from "react-i18next";
import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { summarizeStructure } from "@packages/shared/workout-summary";
import { Text } from "@/components/ui/text";
import {
  workoutStatusLabel,
  workoutTypeLabel,
} from "@/components/app/workout/workout-helpers";
import { ProposalCard } from "./ProposalCard";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatHr,
  formatPace,
} from "./format";
import type { ToolCardProps } from "./types";

interface PlannedFace {
  date: string;
  structure?: unknown;
}

interface ActualFace {
  date: string;
  distanceMeters?: number;
  durationSeconds?: number;
  avgHr?: number;
  rpe?: number;
}

interface CreateInput {
  name: string;
  type: string;
  status: string;
  planned?: PlannedFace;
  actual?: ActualFace;
  blockId?: string;
}

export function CreateWorkoutCard(props: ToolCardProps) {
  const { t } = useTranslation();
  const input = (props.input ?? {}) as Partial<CreateInput>;
  const headerDate = input.planned?.date ?? input.actual?.date;
  const plannedSummary = input.planned?.structure
    ? summarizeStructure(input.planned.structure as WorkoutStructure)
    : undefined;

  const metrics = (() => {
    if (input.actual) {
      const actualPaceMps =
        input.actual.distanceMeters && input.actual.durationSeconds
          ? input.actual.distanceMeters / input.actual.durationSeconds
          : undefined;
      return [
        formatDistance(input.actual.distanceMeters),
        formatDuration(input.actual.durationSeconds),
        formatPace(actualPaceMps),
        formatHr(input.actual.avgHr),
      ].filter((v): v is string => !!v);
    }
    if (plannedSummary) {
      return [
        formatDistance(plannedSummary.distanceMeters),
        formatDuration(plannedSummary.durationSeconds),
        formatPace(plannedSummary.avgPaceMps),
      ].filter((v): v is string => !!v);
    }
    return [];
  })();

  return (
    <ProposalCard
      title={t("coach.tools.card.createWorkoutTitle")}
      state={props.state}
      errorText={props.errorText}
      approvalId={props.approvalId}
      onAccept={props.onAccept}
      onDeny={props.onDeny}
      busy={props.busy}
    >
      <View className="gap-1.5">
        <Text
          className="text-[14px] font-coach-semibold text-wText"
          style={{ lineHeight: 14 * 1.4 }}
        >
          {input.name ?? t("coach.tools.card.workoutFallback")}
        </Text>
        <Text className="text-[12px] font-coach text-wMute">
          {input.type ? workoutTypeLabel(t, input.type) : "—"}
          {input.status ? ` · ${workoutStatusLabel(t, input.status)}` : ""}
          {headerDate ? ` · ${formatDate(headerDate)}` : ""}
        </Text>
        {metrics.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-1">
            {metrics.map((m) => (
              <View key={m} className="px-2 py-0.5 rounded-md bg-w2">
                <Text className="text-[11px] font-coach-medium text-wText">
                  {m}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ProposalCard>
  );
}
