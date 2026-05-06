/**
 * Approval card for the `createWorkout` writing tool.
 *
 * Renders a compact summary of the proposed workout — name, type/status,
 * planned date, and any planned-face metrics (distance, duration, pace, HR).
 * Pure render (no useQuery) since the entity doesn't exist yet.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { ProposalCard } from "./ProposalCard";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatHr,
  formatPace,
  humanize,
} from "./format";
import type { ToolCardProps } from "./types";

interface WorkoutFace {
  date: string;
  distanceMeters?: number;
  durationSeconds?: number;
  avgPaceMps?: number;
  avgHr?: number;
  rpe?: number;
}

interface CreateInput {
  name: string;
  type: string;
  status: string;
  planned?: WorkoutFace;
  actual?: WorkoutFace;
  blockId?: string;
}

export function CreateWorkoutCard(props: ToolCardProps) {
  const input = (props.input ?? {}) as Partial<CreateInput>;
  const face = input.planned ?? input.actual;

  const metrics = face
    ? [
        formatDistance(face.distanceMeters),
        formatDuration(face.durationSeconds),
        formatPace(face.avgPaceMps),
        formatHr(face.avgHr),
      ].filter((v): v is string => !!v)
    : [];

  return (
    <ProposalCard
      title="Create workout"
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
          {input.name ?? "Workout"}
        </Text>
        <Text className="text-[12px] font-coach text-wMute">
          {input.type ? humanize(input.type) : "—"}
          {input.status ? ` · ${humanize(input.status)}` : ""}
          {face?.date ? ` · ${formatDate(face.date)}` : ""}
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
