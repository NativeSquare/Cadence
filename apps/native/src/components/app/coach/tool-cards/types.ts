/**
 * Shared prop shape for every tool card in the registry.
 *
 * One renderer is rendered per tool message part. The renderer receives the
 * tool's `input` (args), the current lifecycle `state`, and (for failed
 * writing-tool calls) an `errorText`. There is no approval flow anymore —
 * writing tools execute immediately, so the card is a read-only summary of
 * the action.
 */

import type { ToolPartState } from "@/lib/ai-stream";

export type ToolCardState = ToolPartState;

export interface ToolCardProps<TInput = unknown, TOutput = unknown> {
  toolCallId: string;
  toolName: string;
  state: ToolCardState;
  input: TInput;
  output?: TOutput;
  errorText?: string;
}

export type ToolCardComponent = React.ComponentType<ToolCardProps>;
