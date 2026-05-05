/**
 * Shared prop shape for every tool card in the registry.
 *
 * One renderer is rendered per tool message part. The renderer receives the
 * tool's `input` (args), the current lifecycle `state`, and — for writing
 * tools awaiting approval — `onAccept` / `onDeny` handlers. Reading tools
 * call this with `approvalId === undefined` and unused handlers.
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
  /** Present when the part is `approval-requested`. */
  approvalId?: string;
  onAccept?: () => void;
  onDeny?: () => void;
  /** Disable buttons while a network round-trip is in flight. */
  busy?: boolean;
}

export type ToolCardComponent = React.ComponentType<ToolCardProps>;
