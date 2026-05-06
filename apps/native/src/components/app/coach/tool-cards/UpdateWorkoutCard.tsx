/**
 * Approval card for the `updateWorkout` writing tool.
 *
 * Reads the current workout via useQuery, then renders a before/after diff
 * for each field present in the patch. Only fields the patch actually
 * mentions are shown — silent fields are not stale-rendered.
 */

import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react-native";
import { View } from "react-native";
import { api } from "@packages/backend/convex/_generated/api";
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
  date?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  avgPaceMps?: number;
  avgHr?: number;
  notes?: string;
}

interface UpdateInput {
  workoutId: string;
  name?: string;
  type?: string;
  status?: string;
  planned?: WorkoutFace;
  actual?: WorkoutFace;
  blockId?: string | null;
}

interface DiffRow {
  label: string;
  before?: string | null;
  after?: string | null;
}

export function UpdateWorkoutCard(props: ToolCardProps) {
  const input = (props.input ?? {}) as Partial<UpdateInput>;
  const result = useQuery(
    api.agoge.workouts.getWorkout,
    input.workoutId ? { workoutId: input.workoutId } : "skip",
  );
  const workout = result?.workout;

  const rows: DiffRow[] = [];
  if (input.name !== undefined) {
    rows.push({ label: "Name", before: workout?.name, after: input.name });
  }
  if (input.type !== undefined) {
    rows.push({
      label: "Type",
      before: workout ? humanize(workout.type) : null,
      after: humanize(input.type),
    });
  }
  if (input.status !== undefined) {
    rows.push({
      label: "Status",
      before: workout ? humanize(workout.status) : null,
      after: humanize(input.status),
    });
  }
  if (input.planned?.date !== undefined) {
    rows.push({
      label: "Planned date",
      before: workout?.planned?.date ? formatDate(workout.planned.date) : null,
      after: formatDate(input.planned.date),
    });
  }
  if (input.planned?.distanceMeters !== undefined) {
    rows.push({
      label: "Distance",
      before: formatDistance(workout?.planned?.distanceMeters),
      after: formatDistance(input.planned.distanceMeters),
    });
  }
  if (input.planned?.durationSeconds !== undefined) {
    rows.push({
      label: "Duration",
      before: formatDuration(workout?.planned?.durationSeconds),
      after: formatDuration(input.planned.durationSeconds),
    });
  }
  if (input.planned?.avgPaceMps !== undefined) {
    rows.push({
      label: "Avg pace",
      before: formatPace(workout?.planned?.avgPaceMps),
      after: formatPace(input.planned.avgPaceMps),
    });
  }
  if (input.planned?.avgHr !== undefined) {
    rows.push({
      label: "Avg HR",
      before: formatHr(workout?.planned?.avgHr),
      after: formatHr(input.planned.avgHr),
    });
  }
  if (input.blockId !== undefined) {
    rows.push({
      label: "Block",
      before: workout?.blockId ?? "—",
      after: input.blockId ?? "—",
    });
  }

  return (
    <ProposalCard
      title="Update workout"
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
          {workout?.name ?? "Workout"}
        </Text>
        {rows.length === 0 ? (
          <Text className="text-[12px] font-coach text-wMute">
            No field changes detected.
          </Text>
        ) : (
          <View className="gap-1.5">
            {rows.map((r) => (
              <DiffRowView key={r.label} row={r} />
            ))}
          </View>
        )}
      </View>
    </ProposalCard>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text
        className="text-[11px] font-coach text-wMute"
        style={{ minWidth: 84 }}
      >
        {row.label}
      </Text>
      <Text className="text-[12px] font-coach text-wMute line-through">
        {row.before ?? "—"}
      </Text>
      <ArrowRight size={11} color="#888" />
      <Text className="text-[12px] font-coach-medium text-wText">
        {row.after ?? "—"}
      </Text>
    </View>
  );
}
