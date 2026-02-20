/**
 * Coach Screen Type Definitions
 * Reference: cadence-full-v9.jsx CoachTab (lines 248-397)
 *
 * Source: Story 10.3 - AC#1, AC#2, AC#3
 */

import type { MessagePart, ToolCall, ToolResult } from "@/lib/ai-stream";

// =============================================================================
// Chat Message Types
// =============================================================================

/**
 * Chat message for coach conversation
 * Reference: prototype INIT_MSGS (lines 249-255)
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  isStreaming: boolean;
  createdAt: number;
  /** True if this message was interrupted by network loss */
  isInterrupted?: boolean;
}

/**
 * Tool message with data payload
 * Reference: prototype tool message format (line 253)
 */
export interface ToolMessage {
  id: string;
  role: "tool";
  title: string;
  data: TrainingLoadData;
}

/**
 * Training load data from coach tools
 * Reference: prototype ToolCard data (lines 264-282)
 */
export interface TrainingLoadData {
  acute: number;
  chronic: number;
  ratio: number;
  note: string;
}

/**
 * Union type for all displayable messages
 */
export type DisplayMessage = ChatMessage | ToolMessage;

// =============================================================================
// Component Props
// =============================================================================

export interface ChatHeaderProps {
  isTyping: boolean;
  statusText?: string;
}

export interface ChatMessageProps {
  message: ChatMessage;
  isCoach: boolean;
}

export interface ToolCardProps {
  title: string;
  data: TrainingLoadData;
}

export interface TypingIndicatorProps {
  visible: boolean;
}

export interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onMicPress: () => void;
  disabled?: boolean;
}

export interface VoiceRecorderProps {
  onCancel: () => void;
  onSend: (text: string) => void;
  transcript: string;
}

// =============================================================================
// Mock Data Types
// =============================================================================

export interface MockReply {
  text: string;
  delay?: number;
}
