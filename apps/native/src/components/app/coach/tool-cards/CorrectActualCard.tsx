/**
 * Card for the `correctActual` writing tool.
 *
 * Reads the workout to show the before/after actual face values for the
 * fields the coach corrected. The `reason` string from the tool args is
 * surfaced verbatim under the diff so the athlete sees why.
 */

import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react-native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { ProposalCard } from "./ProposalCard";
import { formatDistance, formatDuration, formatHr } from "./format";
import type { ToolCardProps } from "./types";

interface ActualFace {
  date?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  avgHr?: number;
  maxHr?: number;
  elevationGainMeters?: number;
  rpe?: number;
  notes?: string;
}

interface CorrectActualInput {
  workoutId: string;
  actual: ActualFace;
  reason: string;
}

interface DiffRow {
  label: string;
  before: string | null;
  after: string | null;
}

export function CorrectActualCard(props: ToolCardProps) {
  const { t } = useTranslation();
  const input = props.input as CorrectActualInput | undefined;
  const result = useQuery(
    api.agoge.workouts.getWorkout,
    input?.workoutId ? { workoutId: input.workoutId } : "skip",
  );
  const workout = result?.workout;
  const beforeActual = workout?.actual;

  const rows: DiffRow[] = [];
  if (input?.actual.distanceMeters !== undefined) {
    rows.push({
      label: t("coach.tools.card.rows.distance"),
      before: formatDistance(beforeActual?.distanceMeters),
      after: formatDistance(input.actual.distanceMeters),
    });
  }
  if (input?.actual.durationSeconds !== undefined) {
    rows.push({
      label: t("coach.tools.card.rows.duration"),
      before: formatDuration(beforeActual?.durationSeconds),
      after: formatDuration(input.actual.durationSeconds),
    });
  }
  if (input?.actual.avgHr !== undefined) {
    rows.push({
      label: t("coach.tools.card.rows.avgHr"),
      before: formatHr(beforeActual?.avgHr),
      after: formatHr(input.actual.avgHr),
    });
  }

  return (
    <ProposalCard
      title={t("coach.tools.card.correctActualTitle")}
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
        {rows.length === 0 ? (
          <Text className="text-[12px] font-coach text-wMute">
            {t("coach.tools.card.noFieldChanges")}
          </Text>
        ) : (
          <View className="gap-1.5">
            {rows.map((r) => (
              <DiffRowView key={r.label} row={r} />
            ))}
          </View>
        )}
        {input?.reason ? (
          <View className="pt-1">
            <Text className="text-[11px] font-coach text-wMute">
              {t("coach.tools.card.rows.reason")}
            </Text>
            <Text
              className="text-[12px] font-coach text-wText"
              style={{ lineHeight: 12 * 1.4 }}
            >
              {input.reason}
            </Text>
          </View>
        ) : null}
      </View>
    </ProposalCard>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text
        className="text-[11px] font-coach text-wMute"
        style={{ minWidth: 70 }}
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
