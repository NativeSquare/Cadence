/**
 * ChatInput - Floating pill input bar inspired by modern chat UIs
 *
 * Layout:
 * - Single rounded container with subtle elevation
 * - Attachment/plus button on the left
 * - Expandable text input in the center
 * - Mic button (when empty) or Send button (when has text) on the right
 *
 * Source: Story 10.3 - AC#1, AC#3, Task 6
 */

import { View, TextInput, Pressable } from "react-native";
import { Mic, ArrowUp, Plus } from "lucide-react-native";
import { LIGHT_THEME } from "@/lib/design-tokens";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import type { ChatInputProps } from "./types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChatInput({
  value,
  onChange,
  onSend,
  onMicPress,
  disabled,
}: ChatInputProps) {
  const hasText = value.trim().length > 0;

  const handleSubmitEditing = () => {
    if (hasText && !disabled) {
      onSend();
    }
  };

  const sendScale = useSharedValue(1);
  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSendPressIn = () => {
    sendScale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  };
  const handleSendPressOut = () => {
    sendScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <View className="px-4 pt-1.5 pb-2">
      <View
        className="flex-row items-end rounded-[24px] bg-w1 px-2 py-1.5"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Plus / attachment button */}
        <Pressable
          disabled={disabled}
          className="w-9 h-9 rounded-full bg-w3 items-center justify-center mb-[1px] active:opacity-60"
        >
          <Plus size={18} color={LIGHT_THEME.wSub} strokeWidth={2} />
        </Pressable>

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={handleSubmitEditing}
          placeholder="Ask your coach..."
          placeholderTextColor={LIGHT_THEME.wMute}
          editable={!disabled}
          multiline
          className="flex-1 mx-2 py-2 text-[15px] text-wText max-h-[120px]"
          style={{ fontFamily: "Outfit-Regular", lineHeight: 20 }}
          returnKeyType="default"
          blurOnSubmit={false}
          autoCapitalize="sentences"
          autoCorrect={true}
          autoComplete="off"
          textContentType="none"
          accessibilityLabel="Message input"
          accessibilityHint="Type a message to your coach"
        />

        {/* Right action: Mic (empty) or Send (has text) */}
        {hasText ? (
          <AnimatedPressable
            key="send"
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            onPress={onSend}
            onPressIn={handleSendPressIn}
            onPressOut={handleSendPressOut}
            disabled={disabled}
            style={[
              sendAnimStyle,
              { opacity: disabled ? 0.5 : 1 },
            ]}
            className="w-9 h-9 rounded-full bg-wText items-center justify-center mb-[1px]"
          >
            <ArrowUp size={18} color="#C8FF00" strokeWidth={2.5} />
          </AnimatedPressable>
        ) : (
          <AnimatedPressable
            key="mic"
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            onPress={onMicPress}
            disabled={disabled}
            className="w-9 h-9 rounded-full items-center justify-center mb-[1px] active:opacity-60"
          >
            <Mic size={18} color={LIGHT_THEME.wMute} strokeWidth={1.8} />
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}
