export type ChatStatusKind =
  | "online"
  | "offline"
  | "reconnecting"
  | "error";

export interface ChatMessageProps {
  text: string;
  isStreaming: boolean;
  isCoach: boolean;
}

export interface PendingAttachment {
  uri: string;
  url?: string;
  isUploading: boolean;
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
  onSend: () => void;
  isBusy?: boolean;
  getMetering: () => number | null;
  isMeteringActive: boolean;
}
