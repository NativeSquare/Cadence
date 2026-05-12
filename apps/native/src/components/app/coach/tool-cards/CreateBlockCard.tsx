/**
 * Approval card for the `createBlock` writing tool.
 *
 * Renders the proposed block: type (+ optional focus), date range.
 */

import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { blockLabel } from "@/components/app/workout/workout-helpers";
import { ProposalCard } from "./ProposalCard";
import { formatDateRange } from "./format";
import type { ToolCardProps } from "./types";

interface CreateBlockInput {
  type: string;
  startDate: string;
  endDate: string;
  focus?: string;
}

export function CreateBlockCard(props: ToolCardProps) {
  const { t } = useTranslation();
  const input = (props.input ?? {}) as Partial<CreateBlockInput>;

  return (
    <ProposalCard
      title={t("coach.tools.card.createBlockTitle")}
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
          {input.type
            ? blockLabel(t, { type: input.type, focus: input.focus })
            : t("coach.tools.card.blockFallback")}
        </Text>
        {input.startDate && input.endDate && (
          <Text className="text-[12px] font-coach text-wMute">
            {formatDateRange(input.startDate, input.endDate)}
          </Text>
        )}
      </View>
    </ProposalCard>
  );
}
