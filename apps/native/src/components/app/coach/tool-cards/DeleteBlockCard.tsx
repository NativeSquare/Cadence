/**
 * Approval card for the `deleteBlock` writing tool.
 *
 * Shows the block label + date range being deleted. Workouts attached to it
 * are detached, not deleted — that's worth surfacing in the body so the user
 * understands the blast radius.
 */

import { useQuery } from "convex/react";
import { Trash2 } from "lucide-react-native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { blockLabel } from "@/components/app/workout/workout-helpers";
import { ProposalCard } from "./ProposalCard";
import { formatDateRange } from "./format";
import type { ToolCardProps } from "./types";

interface DeleteInput {
  blockId: string;
}

export function DeleteBlockCard(props: ToolCardProps) {
  const { t } = useTranslation();
  const input = props.input as DeleteInput | undefined;
  const block = useQuery(
    api.agoge.blocks.getBlock,
    input?.blockId ? { blockId: input.blockId } : "skip",
  );

  return (
    <ProposalCard
      title={t("coach.tools.card.deleteBlockTitle")}
      state={props.state}
      errorText={props.errorText}
      approvalId={props.approvalId}
      onAccept={props.onAccept}
      onDeny={props.onDeny}
      busy={props.busy}
    >
      <View className="gap-2">
        <View className="flex-row items-center gap-2.5">
          <View className="w-7 h-7 rounded-full bg-red-500/10 items-center justify-center">
            <Trash2 size={14} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text
              className="text-[14px] font-coach-semibold text-wText"
              style={{ lineHeight: 14 * 1.4 }}
            >
              {block
                ? blockLabel(t, block)
                : t("coach.tools.card.loading")}
            </Text>
            {block?.startDate && block.endDate && (
              <Text className="text-[12px] font-coach text-wMute">
                {formatDateRange(block.startDate, block.endDate)}
              </Text>
            )}
          </View>
        </View>
        <Text className="text-[11px] font-coach text-wMute italic">
          {t("coach.tools.card.attachedWorkoutsDetached")}
        </Text>
      </View>
    </ProposalCard>
  );
}
