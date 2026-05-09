import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { useAction } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";
import { ChatAttachmentBubble } from "./ChatAttachmentBubble";
import { ChatToolPart } from "./ChatToolPart";
import { ChatErrorCard } from "./ChatErrorCard";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { VoiceRecorder } from "./VoiceRecorder";
import { CoachEmptyState } from "./CoachEmptyState";
import {
  UploadMediaBottomSheetModal,
  type SelectedAttachmentAsset,
} from "@/components/shared/upload-media-bottom-sheet-modal";
import { useCoachAgent } from "@/hooks/use-coach-agent";
import { useUploadImage } from "@/hooks/use-upload-image";
import { useMicrophonePermission } from "@/hooks/use-microphone-permission";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { useLanguage } from "@/lib/i18n";
import { extractToolName, isWritingToolPart } from "@/lib/ai-stream";
import { isKnownWritingTool } from "./tool-cards";
import type { ChatStatusKind, PendingAttachment } from "./types";

const MAX_RECORDING_MS = 60_000;

export interface CoachChatViewProps {
  threadId: string;
  initialPrompt?: string;
}

export function CoachChatView({ threadId, initialPrompt }: CoachChatViewProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const mediaSheetRef = useRef<GorhomBottomSheetModal>(null);
  const { uploadImage, uploadFile, uploadFileToStorage, isUploading } =
    useUploadImage();
  const language = useLanguage();
  const micPermission = useMicrophonePermission();
  const voiceRecording = useVoiceRecording();
  const transcribeAction = useAction(api.coach.voice.transcribe);

  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);

  const {
    messages,
    isStreaming,
    error,
    isOffline,
    isReconnecting,
    retryCount,
    maxRetries,
    isRetriesExhausted,
    sendMessage,
    retry,
    respondToToolApproval,
  } = useCoachAgent({ threadId });

  const [inputValue, setInputValue] = useState(initialPrompt ?? "");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVoiceBusy, setIsVoiceBusy] = useState(false);
  const isVoiceBusyRef = useRef(false);
  const recordingDiscardedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isStreaming]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    const readyAttachments = pendingAttachments
      .filter((a): a is PendingAttachment & { url: string } => !!a.url)
      .map((a) => ({
        url: a.url,
        kind: a.kind,
        mimeType:
          a.mimeType ??
          (a.kind === "image" ? "image/jpeg" : "application/octet-stream"),
      }));
    const hasContent = text.length > 0 || readyAttachments.length > 0;
    if (!hasContent || isStreaming) return;

    Keyboard.dismiss();
    setInputValue("");
    setPendingAttachments([]);

    await sendMessage(text || t("coach.fallbackPrompt"), readyAttachments);
  }, [inputValue, pendingAttachments, isStreaming, sendMessage, t]);

  const handleAttachmentPress = useCallback(() => {
    Keyboard.dismiss();
    mediaSheetRef.current?.present();
  }, []);

  const handleMediaSelected = useCallback(
    async (asset: SelectedAttachmentAsset) => {
      const { uri, kind, mimeType, name } = asset;
      const placeholder: PendingAttachment = { uri, kind, mimeType, name };
      setPendingAttachments((prev) => [...prev, placeholder]);
      try {
        const url =
          kind === "image"
            ? await uploadImage(uri)
            : await uploadFile(uri, mimeType ?? "application/octet-stream");
        setPendingAttachments((prev) =>
          prev.map((a) => (a.uri === uri ? { ...a, url } : a)),
        );
      } catch (err) {
        console.error("[CoachChatView] Upload failed:", err);
        setPendingAttachments((prev) => prev.filter((a) => a.uri !== uri));
        Alert.alert(
          t("coach.upload.failedTitle"),
          kind === "image"
            ? t("coach.upload.failedImage")
            : t("coach.upload.failedFile"),
        );
      }
    },
    [uploadImage, uploadFile, t],
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSuggestionPress = useCallback(
    async (text: string) => {
      if (isStreaming) return;
      Keyboard.dismiss();
      await sendMessage(text);
    },
    [isStreaming, sendMessage],
  );

  const animateTranscript = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        let idx = 0;
        setTranscript("");
        const interval = setInterval(() => {
          if (idx >= text.length) {
            clearInterval(interval);
            resolve();
            return;
          }
          idx = Math.min(
            idx + Math.floor(Math.random() * 3) + 1,
            text.length,
          );
          setTranscript(text.slice(0, idx));
        }, 30);
      }),
    [],
  );

  const transcribeAndSend = useCallback(
    async (storageId: Id<"_storage">) => {
      try {
        const { text } = await transcribeAction({
          storageId,
          locale: language === "fr" ? "fr" : "en",
        });
        if (recordingDiscardedRef.current) return;

        const trimmed = text.trim();
        if (!trimmed) {
          setIsRecording(false);
          setTranscript("");
          return;
        }

        await animateTranscript(trimmed);
        if (recordingDiscardedRef.current) return;

        setIsRecording(false);
        setTranscript("");
        if (!isStreaming) {
          await sendMessage(trimmed);
        }
      } catch (err) {
        if (recordingDiscardedRef.current) return;
        console.error("[CoachChatView] Transcribe failed", err);
        Alert.alert(
          t("coach.voice.transcriptionFailedTitle"),
          t("coach.voice.transcriptionFailedMessage"),
          [
            {
              text: t("coach.voice.discard"),
              style: "cancel",
              onPress: () => {
                recordingDiscardedRef.current = true;
                setIsRecording(false);
                setTranscript("");
              },
            },
            {
              text: t("coach.voice.retry"),
              onPress: () => {
                isVoiceBusyRef.current = true;
                setIsVoiceBusy(true);
                void transcribeAndSend(storageId).finally(() => {
                  isVoiceBusyRef.current = false;
                  setIsVoiceBusy(false);
                });
              },
            },
          ],
        );
      }
    },
    [transcribeAction, language, animateTranscript, isStreaming, sendMessage, t],
  );

  const handleMicPress = useCallback(async () => {
    let granted = micPermission.status === "granted";
    if (!granted) {
      granted = await micPermission.request();
    }
    if (!granted) {
      Alert.alert(
        t("coach.voice.permissionDeniedTitle"),
        t("coach.voice.permissionDeniedMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("coach.voice.openSettings"),
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ],
      );
      return;
    }

    recordingDiscardedRef.current = false;
    setIsRecording(true);
    setTranscript("");

    try {
      await voiceRecording.start();
    } catch (err) {
      console.error("[CoachChatView] Recording start failed", err);
      setIsRecording(false);
    }
  }, [micPermission, voiceRecording, t]);

  const handleVoiceCancel = useCallback(async () => {
    recordingDiscardedRef.current = true;
    setIsRecording(false);
    setTranscript("");
    if (voiceRecording.isRecording) {
      try {
        await voiceRecording.stop();
      } catch (err) {
        console.warn("[CoachChatView] Stop on cancel failed", err);
      }
    }
  }, [voiceRecording]);

  const handleVoiceSend = useCallback(
    async (_text: string) => {
      if (isVoiceBusyRef.current) return;
      isVoiceBusyRef.current = true;
      setIsVoiceBusy(true);

      try {
        let uri: string | null = null;
        try {
          uri = await voiceRecording.stop();
        } catch (err) {
          console.error("[CoachChatView] Stop failed", err);
        }

        if (!uri || recordingDiscardedRef.current) {
          setIsRecording(false);
          setTranscript("");
          return;
        }

        const storageId = await uploadFileToStorage(uri, "audio/m4a");
        if (recordingDiscardedRef.current) return;

        await transcribeAndSend(storageId);
      } catch (err) {
        if (recordingDiscardedRef.current) return;
        console.error("[CoachChatView] Voice send failed", err);
        Alert.alert(
          t("coach.voice.transcriptionFailedTitle"),
          t("coach.voice.transcriptionFailedMessage"),
          [{ text: t("common.cancel"), style: "cancel" }],
        );
        setIsRecording(false);
        setTranscript("");
      } finally {
        isVoiceBusyRef.current = false;
        setIsVoiceBusy(false);
      }
    },
    [voiceRecording, uploadFileToStorage, transcribeAndSend, t],
  );

  // Hard-cap recordings at MAX_RECORDING_MS — auto-trigger the send flow.
  useEffect(() => {
    if (
      isRecording &&
      !isVoiceBusy &&
      voiceRecording.durationMs >= MAX_RECORDING_MS
    ) {
      void handleVoiceSend("");
    }
  }, [
    isRecording,
    isVoiceBusy,
    voiceRecording.durationMs,
    handleVoiceSend,
  ]);

  const statusKind: ChatStatusKind = isOffline
    ? "offline"
    : isReconnecting
      ? "reconnecting"
      : error
        ? "error"
        : "online";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-black"
    >
      <View
        className="bg-black px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <ChatHeader isTyping={isStreaming} statusKind={statusKind} />
      </View>

      <View
        className="flex-1 bg-w2 -mt-1"
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: "hidden",
        }}
      >
        {messages.length === 0 && !isStreaming ? (
          <CoachEmptyState
            onSuggestionPress={handleSuggestionPress}
            disabled={isStreaming || isOffline}
          />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 pt-5"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {(() => {
              // Locate the last assistant text part across all messages so
              // only that bubble shows the Cadence footer icon.
              let footerMsgIdx = -1;
              let footerPartIdx = -1;
              for (let m = messages.length - 1; m >= 0; m--) {
                const msg = messages[m];
                if (msg.role !== "assistant") continue;
                for (let p = msg.parts.length - 1; p >= 0; p--) {
                  const part = msg.parts[p];
                  if (part.type === "text" && part.text) {
                    footerMsgIdx = m;
                    footerPartIdx = p;
                    break;
                  }
                }
                if (footerMsgIdx !== -1) break;
              }

              type RenderItem = {
                key: string;
                sender: "user" | "assistant";
                node: React.ReactNode;
              };
              const items: RenderItem[] = [];

              messages.forEach((message, mIdx) => {
                const isCoach = message.role === "assistant";
                const lastIdx = message.parts.length - 1;
                message.parts.forEach((part, idx) => {
                  const partKey = `${message.id}:${idx}`;
                  if (part.type === "text") {
                    if (!part.text) return;
                    items.push({
                      key: partKey,
                      sender: message.role,
                      node: (
                        <ChatMessageBubble
                          message={{
                            id: partKey,
                            role: message.role,
                            content: part.text,
                            parts: [part],
                            isStreaming: message.isStreaming && idx === lastIdx,
                            createdAt: message.createdAt,
                          }}
                          isCoach={isCoach}
                          showFooterIcon={
                            mIdx === footerMsgIdx && idx === footerPartIdx
                          }
                        />
                      ),
                    });
                    return;
                  }
                  if (part.type === "file") {
                    items.push({
                      key: partKey,
                      sender: message.role,
                      node: (
                        <ChatAttachmentBubble
                          mediaType={part.mediaType}
                          url={part.url}
                          filename={part.filename}
                          isUser={!isCoach}
                        />
                      ),
                    });
                    return;
                  }
                  // Skip known writing tools that haven't reached an
                  // approval state — ChatToolPart renders null for them
                  // (silent-retry / pre-approval), and a bare wrapper
                  // would leave a marginBottom gap.
                  if (
                    !isWritingToolPart(part) &&
                    isKnownWritingTool(extractToolName(part))
                  ) {
                    return;
                  }
                  items.push({
                    key: partKey,
                    sender: "assistant",
                    node: (
                      <ChatToolPart
                        part={part}
                        onRespond={respondToToolApproval}
                      />
                    ),
                  });
                });
              });

              // Turn-aware spacing: 24px between sender swaps, 16px within
              // a single sender's run.
              return items.map((item, i) => {
                const next = items[i + 1];
                const marginBottom = !next
                  ? 0
                  : next.sender === item.sender
                    ? 16
                    : 24;
                return (
                  <View key={item.key} style={{ marginBottom }}>
                    {item.node}
                  </View>
                );
              });
            })()}

            <TypingIndicator visible={isStreaming} />

            {error && !isStreaming && (
              <ChatErrorCard
                message={
                  isRetriesExhausted
                    ? t("coach.errorCard.connectionTrouble")
                    : t("coach.errorCard.somethingWentWrong")
                }
                onRetry={!isRetriesExhausted ? retry : undefined}
                retryCount={retryCount}
                maxRetries={maxRetries}
              />
            )}
          </ScrollView>
        )}

        <View className="bg-w2">
          {isRecording ? (
            <VoiceRecorder
              transcript={transcript}
              onCancel={handleVoiceCancel}
              onSend={handleVoiceSend}
              isBusy={isVoiceBusy}
            />
          ) : (
            <>
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                onMicPress={handleMicPress}
                onAttachmentPress={handleAttachmentPress}
                attachments={pendingAttachments}
                onRemoveAttachment={handleRemoveAttachment}
                disabled={isStreaming || isOffline || isUploading}
              />
              <UploadMediaBottomSheetModal
                bottomSheetModalRef={mediaSheetRef}
                onAttachmentSelected={handleMediaSelected}
                options={["camera", "gallery", "files"]}
              />
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
