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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";
import { ChatErrorCard } from "./ChatErrorCard";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { VoiceRecorder } from "./VoiceRecorder";
import { CoachEmptyState } from "./CoachEmptyState";
import { useAIChat, type ChatMessage } from "@/hooks/use-ai-chat";

export interface CoachChatViewProps {
  conversationId: string;
  initialHistory: ChatMessage[];
  persistUserMessage: (content: string) => Promise<void>;
  persistAssistantMessage: (message: ChatMessage) => Promise<void>;
}

export function CoachChatView({
  conversationId,
  initialHistory,
  persistUserMessage,
  persistAssistantMessage,
}: CoachChatViewProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

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
  const [inputValue, setInputValue] = useState("");
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
    if (!text || isStreaming) return;

    Keyboard.dismiss();
    setInputValue("");

    // Persist to Convex in background (for Seshat compaction), don't block UI
    persistUserMessage(text);
    await sendMessage(text);
  }, [inputValue, isStreaming, sendMessage, persistUserMessage]);

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
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              onMicPress={handleMicPress}
              disabled={isStreaming || isOffline}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
