export type ToolPartState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error";

export interface ToolMessagePart {
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

export interface FileMessagePart {
  type: "file";
  mediaType: string;
  url: string;
  filename?: string;
}

export type MessagePart =
  | { type: "text"; text: string }
  | FileMessagePart
  | ToolMessagePart;

export function extractToolName(part: ToolMessagePart): string {
  return part.type.slice("tool-".length);
}

export function isWritingToolPart(part: ToolMessagePart): boolean {
  return (
    !!part.approval ||
    part.state === "approval-requested" ||
    part.state === "approval-responded"
  );
}
