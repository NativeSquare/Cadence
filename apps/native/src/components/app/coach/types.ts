import type { MessagePart } from "@/lib/ai-stream";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  isStreaming: boolean;
  createdAt: number;
  isInterrupted?: boolean;
}

export interface ChatHeaderProps {
  isTyping: boolean;
  statusText?: string;
}

export interface ChatMessageProps {
  message: ChatMessage;
  isCoach: boolean;
  showFooterIcon?: boolean;
}

export interface TypingIndicatorProps {
  visible: boolean;
}

export interface PendingAttachment {
  uri: string;
  url?: string;
}

export interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onMicPress: () => void;
  onAttachmentPress?: () => void;
  attachments?: PendingAttachment[];
  onRemoveAttachment?: (index: number) => void;
  disabled?: boolean;
}

export interface VoiceRecorderProps {
  onCancel: () => void;
  onSend: (text: string) => void;
  transcript: string;
}
