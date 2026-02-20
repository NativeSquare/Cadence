/**
 * ChatInput - Text input with mic and send buttons
 * Reference: cadence-full-v9.jsx CoachTab input (lines 366-377)
 *
 * Layout from prototype:
 * - Container: flex-row gap-8, alignItems:"center", marginTop:10
 * - Input field: flex:1, borderRadius:16, bg:T.w1, border:"1px solid "+T.wBrd
 * - Mic button: width:42, height:42, borderRadius:14, bg:T.w1, border:"1px solid "+T.wBrd
 * - Send button: width:42, height:42, borderRadius:14, bg depends on input state
 *
 * Font specifications:
 * - Input text: fontSize:14, color:T.wText
 * - Placeholder: "Ask your coach..."
 *
 * Source: Story 10.3 - AC#1, AC#3, Task 6
 */

import { View, TextInput, Pressable } from "react-native";
import { Mic, Send } from "lucide-react-native";
import { LIGHT_THEME, GRAYS } from "@/lib/design-tokens";

import type { ChatInputProps } from "./types";

// =============================================================================
// Main Component
// =============================================================================

/**
 * ChatInput component
 *
 * Renders the chat input area with:
 * - Text input with placeholder
 * - Microphone button (opens recording mode)
 * - Send button (enabled when input has text)
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  onMicPress,
  disabled,
}: ChatInputProps) {
  const hasText = value.trim().length > 0;

  // Handle keyboard enter press
  const handleSubmitEditing = () => {
    if (hasText && !disabled) {
      onSend();
    }
  };

  return (
    <View className="flex-row gap-2 items-center px-4 pt-2.5">
      {/* Text input container */}
      <View className="flex-1 flex-row items-center rounded-2xl bg-w1 border border-wBrd overflow-hidden">
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={handleSubmitEditing}
          placeholder="Ask your coach..."
          placeholderTextColor={LIGHT_THEME.wMute}
          editable={!disabled}
          className="flex-1 px-4 py-3 text-[14px] text-wText"
          style={{ fontFamily: "Outfit-Regular" }}
          // Native keyboard configuration
          returnKeyType="send"
          blurOnSubmit={false}
          autoCapitalize="sentences"
          autoCorrect={true}
          autoComplete="off"
          enablesReturnKeyAutomatically={true}
          keyboardType="default"
          textContentType="none"
          // Accessibility
          accessibilityLabel="Message input"
          accessibilityHint="Type a message to your coach"
        />
      </View>

      {/* Mic button */}
      <Pressable
        onPress={onMicPress}
        disabled={disabled}
        className="w-[42px] h-[42px] rounded-[14px] bg-w1 border border-wBrd items-center justify-center active:opacity-70"
      >
        <Mic size={16} color={LIGHT_THEME.wMute} />
      </Pressable>

      {/* Send button - changes color based on input state */}
      <Pressable
        onPress={onSend}
        disabled={!hasText || disabled}
        className={`w-[42px] h-[42px] rounded-[14px] items-center justify-center ${
          hasText ? "bg-wText" : "bg-w3"
        }`}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <Send
          size={16}
          color={hasText ? "#C8FF00" : LIGHT_THEME.wMute}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}
