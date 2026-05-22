import type { UIMessage } from "@convex-dev/agent/react";

type UIPart = UIMessage["parts"][number];
export type ToolPart = Extract<UIPart, { toolCallId: string }>;
export type ToolPartState = ToolPart["state"];

export function isToolPart(part: UIPart): part is ToolPart {
  return (
    typeof part.type === "string" &&
    (part.type.startsWith("tool-") || part.type === "dynamic-tool")
  );
}

export function getToolPartName(part: ToolPart): string {
  if (part.type === "dynamic-tool") {
    return part.toolName;
  }
  return part.type.slice("tool-".length);
}
