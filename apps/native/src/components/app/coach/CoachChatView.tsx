/**
 * CoachChatView - Chat UI wired to the Router pipeline.
 *
 * Messages are derived reactively from the `messages` table via useAIChat.
 * User sends go through intelligence.events.ingestChat; tool cards render
 * from `parts: [{ type: "tool-call", ... }]` and post tool decisions back
 * through the same ingest path when the user accepts/declines.
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
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";
import { ChatErrorCard } from "./ChatErrorCard";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { VoiceRecorder } from "./VoiceRecorder";
import { CoachEmptyState } from "./CoachEmptyState";
import { CoachToolRenderer } from "./CoachToolRenderer";
import { UploadMediaBottomSheetModal } from "@/components/shared/upload-media-bottom-sheet-modal";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useUploadImage } from "@/hooks/use-upload-image";
import type { PendingAttachment } from "./types";
import type { RescheduleProposal, SwapProposal, SkipProposal } from "./actions";

export interface CoachChatViewProps {
  conversationId: string;
  initialPrompt?: string;
}

export function CoachChatView({
  conversationId,
  initialPrompt,
}: CoachChatViewProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const mediaSheetRef = useRef<GorhomBottomSheetModal>(null);
  const { uploadImage, isUploading } = useUploadImage();

  // Pending media attachments (local uri → upload → url for API)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

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
    sendToolDecision,
    retry,
  } = useAIChat({ conversationId });

  // Convex mutations for action tools (executed on Accept)
  const rescheduleSession = useMutation(api.plan.actions.rescheduleWorkout);
  const modifySession = useMutation(api.plan.actions.modifyWorkout);
  const swapSessions = useMutation(api.plan.actions.swapWorkouts);
  const skipSession = useMutation(api.plan.actions.skipWorkout);

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

    await sendMessage(text || "What do you see?", attachmentUrls);
  }, [inputValue, pendingAttachments, isStreaming, sendMessage]);

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
      await sendMessage(text);
    },
    [isStreaming, sendMessage]
  );

  // =========================================================================
  // Action Tool Handlers
  // =========================================================================

  /** Execute the correct mutation based on the action tool name */
  const handleExecuteMutation = useCallback(
    async (toolName: string, args: unknown): Promise<{ success: boolean; error?: string }> => {
      try {
        switch (toolName) {
          case "proposeRescheduleSession": {
            const p = args as RescheduleProposal;
            await rescheduleSession({
              workoutId: p.sessionId,
              scheduledDate: new Date(p.proposedDate).toISOString().slice(0, 10),
            });
            return { success: true };
          }
          case "proposeModifySession": {
            const p = args as {
              sessionId: string;
              changes: Array<{ field: string; newValue: string }>;
              reason: string;
            };
            const patch: {
              workoutId: string;
              name?: string;
              description?: string;
              targetDurationSeconds?: number;
              targetDistanceMeters?: number;
            } = { workoutId: p.sessionId };
            for (const c of p.changes) {
              if (c.field === "name") patch.name = c.newValue;
              else if (c.field === "description") patch.description = c.newValue;
              else if (c.field === "targetDurationSeconds")
                patch.targetDurationSeconds = Number(c.newValue);
              else if (c.field === "targetDistanceMeters")
                patch.targetDistanceMeters = Number(c.newValue);
            }
            await modifySession(patch);
            return { success: true };
          }
          case "proposeSwapSessions": {
            const p = args as SwapProposal;
            await swapSessions({
              workoutAId: p.sessionA.sessionId,
              workoutBId: p.sessionB.sessionId,
            });
            return { success: true };
          }
          case "proposeSkipSession": {
            const p = args as SkipProposal;
            await skipSession({ workoutId: p.sessionId });
            return { success: true };
          }
          default:
            return { success: false, error: `Unknown action: ${toolName}` };
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        };
      }
    },
    [rescheduleSession, modifySession, swapSessions, skipSession],
  );

  /** Post typed decision event to Router so it can follow up in Craftsperson voice. */
  const handleActionAccepted = useCallback(
    (toolName: string, args: unknown) => {
      void sendToolDecision({ toolName, toolArgs: args, decision: "accepted" });
    },
    [sendToolDecision],
  );

  const handleActionRejected = useCallback(
    (toolName: string, args: unknown) => {
      void sendToolDecision({ toolName, toolArgs: args, decision: "declined" });
    },
    [sendToolDecision],
  );

  // =========================================================================
  // Helpers
  // =========================================================================

  /** Check if a tool-call part is an action tool */
  const isActionTool = (toolName: string) =>
    toolName.startsWith("propose");

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

      await sendMessage(trimmed);
    },
    [isStreaming, sendMessage]
  );

  // Derive header status text
  const statusText = isOffline
    ? "Offline"
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
              // Extract action tool calls from assistant message parts
              const actionParts =
                message.role === "assistant"
                  ? message.parts.filter(
                      (p) => p.type === "tool-call" && isActionTool(p.toolName),
                    )
                  : [];

              // Skip assistant messages with no text and no action tools
              if (
                message.role === "assistant" &&
                !message.content &&
                actionParts.length === 0
              ) {
                return null;
              }

              return (
                <View key={message.id}>
                  {/* Text bubble (only if there's text content) */}
                  {message.content ? (
                    <ChatMessageBubble
                      message={message}
                      isCoach={message.role === "assistant"}
                    />
                  ) : null}

                  {/* Action tool cards (inline after text) */}
                  {actionParts.map((part: any) => (
                    <CoachToolRenderer
                      key={part.toolCallId}
                      toolName={part.toolName}
                      toolCallId={part.toolCallId}
                      state={message.isStreaming ? "streaming" : "call"}
                      args={part.args}
                      executeMutation={handleExecuteMutation}
                      onAccepted={handleActionAccepted}
                      onRejected={handleActionRejected}
                    />
                  ))}
                </View>
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
