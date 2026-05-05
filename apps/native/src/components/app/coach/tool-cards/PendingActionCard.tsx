/**
 * Generic fallback card for any writing tool without a specific renderer.
 *
 * Wraps `ProposalCard` and renders the raw JSON input as the body. Tool-
 * specific cards should also use `ProposalCard` and supply their own body
 * + a tailored title.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { ProposalCard } from "./ProposalCard";
import type { ToolCardProps } from "./types";

export function PendingActionCard({
  toolName,
  state,
  input,
  errorText,
  approvalId,
  onAccept,
  onDeny,
  busy,
}: ToolCardProps) {
  return (
    <ProposalCard
      title={humanizeToolName(toolName)}
      state={state}
      errorText={errorText}
      approvalId={approvalId}
      onAccept={onAccept}
      onDeny={onDeny}
      busy={busy}
    >
      <View className="bg-w2 rounded-lg px-3 py-2.5">
        <Text
          className="text-[12px] font-coach text-wMute"
          style={{ lineHeight: 12 * 1.5 }}
        >
          {JSON.stringify(input, null, 2)}
        </Text>
      </View>
    </ProposalCard>
  );
}

function humanizeToolName(name: string): string {
  const spaced = name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
