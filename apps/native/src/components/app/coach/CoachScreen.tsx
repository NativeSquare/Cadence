/**
 * CoachScreen - Main container for the Coach/Chat tab
 * Reference: cadence-full-v9.jsx CoachTab component (lines 289-396)
 *
 * Features:
 * - Chat header with title and status
 * - Scrollable message list with keyboard-aware behavior
 * - Message bubbles for coach and user
 * - Tool cards for data display
 * - Typing indicator
 * - Text input with mic and send buttons
 * - Voice recording mode
 *
 * Source: Story 10.3 - AC#1, AC#2, AC#3, AC#4, AC#5
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
import { ChatMessage } from "./ChatMessage";
import { ToolCard } from "./ToolCard";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { VoiceRecorder } from "./VoiceRecorder";
import {
  INITIAL_MESSAGES,
  getNextMockReply,
  isToolMessage,
  isChatMessage,
} from "./mock-data";
import type { DisplayMessage, ChatMessage as ChatMessageType } from "./types";

// =============================================================================
// Component
// =============================================================================

/**
 * CoachScreen main component
 *
 * Layout from prototype (lines 322-394):
 * - Dark header with title and status (bg-black)
 * - Light content area with rounded top corners (bg-w2, 28px radius)
 * - Scrollable message list (flex: 1)
 * - Input area at bottom with border-top (fixed height)
 */
export function CoachScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [messages, setMessages] = useState<DisplayMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  /**
   * Handle sending a message
   * Reference: prototype send function (lines 313-320)
   */
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    // Dismiss keyboard when sending
    Keyboard.dismiss();

    // Add user message
    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      parts: [{ type: "text", text }],
      isStreaming: false,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate coach reply with mock data
    const mockReply = getNextMockReply();
    setTimeout(() => {
      setIsTyping(false);
      const coachMessage: ChatMessageType = {
        id: `coach_${Date.now()}`,
        role: "assistant",
        content: mockReply.text,
        parts: [{ type: "text", text: mockReply.text }],
        isStreaming: false,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, coachMessage]);
    }, mockReply.delay ?? 1200);
  }, [inputValue]);

  /**
   * Handle mic button press - enter recording mode
   */
  const handleMicPress = useCallback(() => {
    setIsRecording(true);
    setTranscript("");

    // Simulate live transcription (prototype lines 302-311)
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

  /**
   * Handle voice recording cancel
   */
  const handleVoiceCancel = useCallback(() => {
    setIsRecording(false);
    setTranscript("");
  }, []);

  /**
   * Handle voice recording send
   */
  const handleVoiceSend = useCallback((text: string) => {
    setIsRecording(false);
    setTranscript("");

    if (!text.trim()) return;

    // Add user message from transcript
    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text.trim(),
      parts: [{ type: "text", text: text.trim() }],
      isStreaming: false,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate coach reply
    const mockReply = getNextMockReply();
    setTimeout(() => {
      setIsTyping(false);
      const coachMessage: ChatMessageType = {
        id: `coach_${Date.now()}`,
        role: "assistant",
        content: mockReply.text,
        parts: [{ type: "text", text: mockReply.text }],
        isStreaming: false,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, coachMessage]);
    }, mockReply.delay ?? 1200);
  }, []);

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
        <ChatHeader isTyping={isTyping} />
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
        {/* Message list */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((message) => {
            if (isToolMessage(message)) {
              return (
                <ToolCard
                  key={message.id}
                  title={message.title}
                  data={message.data}
                />
              );
            }

            if (isChatMessage(message)) {
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isCoach={message.role === "assistant"}
                />
              );
            }

            return null;
          })}

          {/* Typing indicator */}
          <TypingIndicator visible={isTyping} />
        </ScrollView>

        {/* Input area */}
        <View className="bg-w2 border-t border-wBrd">
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
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
