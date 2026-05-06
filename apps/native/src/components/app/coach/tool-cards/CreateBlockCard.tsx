/**
 * Approval card for the `createBlock` writing tool.
 *
 * Renders the proposed block: name, type, date range, focus.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { ProposalCard } from "./ProposalCard";
import { formatDateRange, humanize } from "./format";
import type { ToolCardProps } from "./types";

interface CreateBlockInput {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  focus?: string;
  order?: number;
}

export function CreateBlockCard(props: ToolCardProps) {
  const input = (props.input ?? {}) as Partial<CreateBlockInput>;

  return (
    <ProposalCard
      title="Create block"
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
          {input.name ?? "Block"}
        </Text>
        <Text className="text-[12px] font-coach text-wMute">
          {input.type ? humanize(input.type) : "—"}
          {input.startDate && input.endDate
            ? ` · ${formatDateRange(input.startDate, input.endDate)}`
            : ""}
        </Text>
        {input.focus && (
          <Text className="text-[12px] font-coach text-wText mt-1">
            {input.focus}
          </Text>
        )}
      </View>
    </ProposalCard>
  );
}
