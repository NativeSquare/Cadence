/**
 * CoachChatView - Chat UI wired to the real AI streaming backend
 *
 * Mounts only after conversation + history are loaded so that
 * `useAIChat` receives the correct initial messages on first render.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";
import { ChatErrorCard } from "./ChatErrorCard";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { VoiceRecorder } from "./VoiceRecorder";
import { CoachEmptyState } from "./CoachEmptyState";
import { UploadMediaBottomSheetModal } from "@/components/shared/upload-media-bottom-sheet-modal";
import { useAIChat, type ChatMessage } from "@/hooks/use-ai-chat";
import { useUploadImage } from "@/hooks/use-upload-image";
import type { PendingAttachment } from "./types";

export interface CoachChatViewProps {
  conversationId: string;
  initialHistory: ChatMessage[];
  persistUserMessage: (content: string) => Promise<void>;
  persistAssistantMessage: (message: ChatMessage) => Promise<void>;
  initialPrompt?: string;
}

export function CoachChatView({
  conversationId,
  initialHistory,
  persistUserMessage,
  persistAssistantMessage,
  initialPrompt,
}: CoachChatViewProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const mediaSheetRef = useRef<GorhomBottomSheetModal>(null);
  const { uploadImage, isUploading } = useUploadImage();

  // Pending media attachments (local uri → upload → url for API)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  // Capture history snapshot on mount (ignore reactive updates)
  const [stableInitialMessages] = useState<ChatMessage[]>(() => initialHistory);

  const {
    messages,
    isStreaming,
    error,
    isOffline,
    isReconnecting,
    disconnectionDuration,
    retryCount,
    maxRetries,
    isRetriesExhausted,
    sendMessage,
    abort,
    retry,
  } = useAIChat({
    conversationId,
    initialMessages: stableInitialMessages,
    onComplete: persistAssistantMessage,
  });

  // Voice recording state
  const [inputValue, setInputValue] = useState(initialPrompt ?? "");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Auto-scroll to bottom when messages change or streaming state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isStreaming]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    const attachmentUrls = pendingAttachments
      .map((a) => a.url)
      .filter((u): u is string => !!u);
    const hasContent = text.length > 0 || attachmentUrls.length > 0;
    if (!hasContent || isStreaming) return;

    Keyboard.dismiss();
    setInputValue("");
    setPendingAttachments([]);

    // Persist text to Convex (images are sent in stream; compaction sees "[Image attached]")
    persistUserMessage(text || "[Image attached]");
    await sendMessage(text || "What do you see?", attachmentUrls);
  }, [inputValue, pendingAttachments, isStreaming, sendMessage, persistUserMessage]);

  const handleAttachmentPress = useCallback(() => {
    mediaSheetRef.current?.present();
  }, []);

  const handleMediaSelected = useCallback(
    async (asset: { uri: string; width?: number; height?: number }) => {
      const uri = asset.uri;
      const placeholder: PendingAttachment = { uri };
      setPendingAttachments((prev) => [...prev, placeholder]);
      try {
        const url = await uploadImage(uri);
        setPendingAttachments((prev) =>
          prev.map((a) => (a.uri === uri ? { ...a, url } : a))
        );
      } catch (err) {
        console.error("[CoachChatView] Upload failed:", err);
        setPendingAttachments((prev) => prev.filter((a) => a.uri !== uri));
        Alert.alert("Upload failed", "Could not upload the image. Please try again.");
      }
    },
    [uploadImage]
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSuggestionPress = useCallback(
    async (text: string) => {
      if (isStreaming) return;
      Keyboard.dismiss();
      persistUserMessage(text);
      await sendMessage(text);
    },
    [isStreaming, sendMessage, persistUserMessage]
  );

  const handleMicPress = useCallback(() => {
    setIsRecording(true);
    setTranscript("");

    // TODO: Replace with real speech-to-text integration
    let idx = 0;
    const mockTranscript = "Can we swap tomorrow's rest for an easy run";
    const interval = setInterval(() => {
      if (idx < mockTranscript.length) {
        idx = Math.min(
          idx + Math.floor(Math.random() * 3) + 1,
          mockTranscript.length
        );
        setTranscript(mockTranscript.slice(0, idx));
      } else {
        clearInterval(interval);
      }
    }, 80);
  }, []);

  const handleVoiceCancel = useCallback(() => {
    setIsRecording(false);
    setTranscript("");
  }, []);

  const handleVoiceSend = useCallback(
    async (text: string) => {
      setIsRecording(false);
      setTranscript("");

      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      persistUserMessage(trimmed);
      await sendMessage(trimmed);
    },
    [isStreaming, sendMessage, persistUserMessage]
  );

  // Derive header status text
  const statusText = isOffline
    ? `Offline · ${disconnectionDuration}s`
    : isReconnecting
      ? "Reconnecting..."
      : error
        ? "Error · tap retry"
        : undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-black"
    >
      {/* Dark header area */}
      <View
        className="bg-black px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <ChatHeader isTyping={isStreaming} statusText={statusText} />
      </View>

      {/* Light content area with chat */}
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
            {messages.map((message) => {
              if (
                message.role === "assistant" &&
                !message.content
              ) {
                return null;
              }
              return (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  isCoach={message.role === "assistant"}
                />
              );
            })}

            {/* Typing indicator */}
            <TypingIndicator visible={isStreaming} />

            {/* Error state */}
            {error && !isStreaming && (
              <ChatErrorCard
                message={
                  isRetriesExhausted
                    ? "I'm having trouble connecting right now. Please try again later."
                    : "Something went wrong. Let's try that again."
                }
                onRetry={!isRetriesExhausted ? retry : undefined}
                retryCount={retryCount}
                maxRetries={maxRetries}
              />
            )}
          </ScrollView>
        )}

        {/* Input area */}
        <View className="bg-w2">
          {isRecording ? (
            <VoiceRecorder
              transcript={transcript}
              onCancel={handleVoiceCancel}
              onSend={handleVoiceSend}
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
                onImageSelected={handleMediaSelected}
                options={["camera", "gallery", "files"]}
              />
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
