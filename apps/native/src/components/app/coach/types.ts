export type ChatStatusKind =
  | "online"
  | "offline"
  | "reconnecting"
  | "error";

export interface ChatHeaderProps {
  isTyping: boolean;
  /**
   * Discriminated status from the agent state. The header maps this to a
   * translated label and the dot color — passing a free string would prevent
   * locale-aware copy and force English-prefix string-sniffing for color.
   */
  statusKind: ChatStatusKind;
}

export interface ChatMessageProps {
  text: string;
  isStreaming: boolean;
  isCoach: boolean;
}

export interface TypingIndicatorProps {
  visible: boolean;
}

export interface PendingAttachment {
  uri: string;
  url?: string;
  kind: "image" | "file";
  mimeType?: string;
  name?: string;
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
  isBusy?: boolean;
}
