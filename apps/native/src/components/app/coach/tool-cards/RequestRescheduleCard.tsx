/**
 * Card for the `requestReschedule` writing tool.
 *
 * The coach asks the Engine to move a workout; the Engine picks "move" or
 * "swap" or rejects. Output carries `result.action` ("moved" | "swapped") and
 * `before` (pre-mutation date plus the swap partner if any) — the card uses
 * `before` so it can show the pre-move date even after the workout has been
 * updated in the DB.
 */

import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react-native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { ProposalCard } from "./ProposalCard";
import { formatDate } from "./format";
import type { ToolCardProps } from "./types";

interface RescheduleInput {
  workoutId: string;
  toDate: string;
}

interface RescheduleOutput {
  ok?: boolean;
  result?: { action: "moved" | "swapped" };
  before?: {
    workoutId: string;
    plannedDate: string;
    swappedWith?: { workoutId: string; plannedDate: string };
  };
  errors?: { code: string; message: string }[];
}

export function RequestRescheduleCard(props: ToolCardProps) {
  const { t } = useTranslation();
  const input = props.input as RescheduleInput | undefined;
  const output = props.output as RescheduleOutput | undefined;

  const result = useQuery(
    api.agoge.workouts.getWorkout,
    input?.workoutId ? { workoutId: input.workoutId } : "skip",
  );
  const workoutName =
    result?.workout?.name ?? t("coach.tools.card.workoutFallback");

  const fromDate = output?.before?.plannedDate;
  const toDate = input?.toDate;
  const action = output?.result?.action;

  return (
    <ProposalCard
      title={
        action === "swapped"
          ? t("coach.tools.card.requestRescheduleSwappedTitle")
          : t("coach.tools.card.requestRescheduleTitle")
      }
      state={props.state}
      errorText={props.errorText}
    >
      <View className="gap-2">
        <Text
          className="text-[14px] font-coach-semibold text-wText"
          style={{ lineHeight: 14 * 1.4 }}
        >
          {workoutName}
        </Text>
        <View className="flex-row items-center gap-2">
          <DateChip iso={fromDate} muted />
          <ArrowRight size={14} color="#888" />
          <DateChip iso={toDate} />
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
