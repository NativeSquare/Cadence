/**
 * Coach chat message part types.
 *
 * The Coach UI consumes messages from `@convex-dev/agent`'s `useUIMessages`
 * hook (AI SDK v6 shape). Each message has a `parts` array; this file
 * declares the subset we care about and exposes small helpers.
 */

/**
 * Tool message parts produced by `@convex-dev/agent` + AI SDK v6.
 *
 * The AI SDK tags tool parts as `tool-${toolName}` rather than a single
 * "tool-call" type. The `state` discriminates the lifecycle:
 *
 *   input-streaming    — args are still streaming in
 *   input-available    — tool will execute (or is awaiting approval)
 *   approval-requested — needsApproval=true; user must Accept/Deny
 *   approval-responded — user has Accepted/Denied; framework continues
 *   output-available   — execute() finished, result is in `output`
 *   output-error       — execute() threw
 *
 * When `state === "approval-requested"`, an `approval` object carries the
 * `approvalId` to pass back to `coach.messages.respondToToolApproval`.
 */
export type ToolPartState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error";

export interface ToolMessagePart {
  /** Always `tool-<toolName>` — extract the tool name with `extractToolName`. */
  type: `tool-${string}`;
  toolCallId: string;
  state: ToolPartState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: {
    id: string;
    approved?: boolean;
    reason?: string;
  };
}

export type MessagePart =
  | { type: "text"; text: string }
  | ToolMessagePart;

export function isToolPart(part: MessagePart): part is ToolMessagePart {
  return part.type.startsWith("tool-");
}

export function extractToolName(part: ToolMessagePart): string {
  return part.type.slice("tool-".length);
}
