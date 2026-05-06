/**
 * Approval card for the `updateBlock` writing tool.
 *
 * Reads the current block via useQuery, then renders before/after diff rows
 * for each field present in the patch.
 */

import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react-native";
import { View } from "react-native";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { ProposalCard } from "./ProposalCard";
import { formatDate, humanize } from "./format";
import type { ToolCardProps } from "./types";

interface UpdateBlockInput {
  blockId: string;
  name?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  focus?: string;
  order?: number;
}

interface DiffRow {
  label: string;
  before?: string | null;
  after?: string | null;
}

export function UpdateBlockCard(props: ToolCardProps) {
  const input = (props.input ?? {}) as Partial<UpdateBlockInput>;
  const block = useQuery(
    api.agoge.blocks.getBlock,
    input.blockId ? { blockId: input.blockId } : "skip",
  );

  const rows: DiffRow[] = [];
  if (input.name !== undefined) {
    rows.push({ label: "Name", before: block?.name, after: input.name });
  }
  if (input.type !== undefined) {
    rows.push({
      label: "Type",
      before: block ? humanize(block.type) : null,
      after: humanize(input.type),
    });
  }
  if (input.startDate !== undefined) {
    rows.push({
      label: "Start",
      before: block?.startDate ? formatDate(block.startDate) : null,
      after: formatDate(input.startDate),
    });
  }
  if (input.endDate !== undefined) {
    rows.push({
      label: "End",
      before: block?.endDate ? formatDate(block.endDate) : null,
      after: formatDate(input.endDate),
    });
  }
  if (input.focus !== undefined) {
    rows.push({
      label: "Focus",
      before: block?.focus ?? "—",
      after: input.focus || "—",
    });
  }
  if (input.order !== undefined) {
    rows.push({
      label: "Order",
      before: block?.order != null ? String(block.order) : null,
      after: String(input.order),
    });
  }

  return (
    <ProposalCard
      title="Update block"
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
          {block?.name ?? "Block"}
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
        style={{ minWidth: 64 }}
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
