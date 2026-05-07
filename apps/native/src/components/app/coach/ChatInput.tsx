import {
  View,
  TextInput,
  Pressable,
  Image,
  Text,
  ScrollView,
} from "react-native";
import { Mic, ArrowUp, Plus, X, FileText } from "lucide-react-native";
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

const ATTACHMENT_SIZE = 64;

export function ChatInput({
  value,
  onChange,
  onSend,
  onMicPress,
  onAttachmentPress,
  attachments = [],
  onRemoveAttachment,
  disabled,
}: ChatInputProps) {
  const hasText = value.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = hasText || hasAttachments;

  const handleSubmitEditing = () => {
    if (canSend && !disabled) {
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
    <View className="flex-row items-end gap-2 px-4 pt-1.5 pb-2">
      {/* Plus / attachment button */}
      <Pressable
        onPress={onAttachmentPress}
        disabled={disabled}
        className="w-11 h-11 rounded-full bg-w1 items-center justify-center mb-[1px] active:opacity-60"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
        accessibilityLabel="Add photo or file"
        accessibilityHint="Opens options to take a photo, choose from library, or browse files"
      >
        <Plus size={22} color={LIGHT_THEME.wSub} strokeWidth={2} />
      </Pressable>

      <View
        className="flex-1 flex-row items-end rounded-[24px] bg-w1 pl-2 pr-1.5 py-1.5"
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
        <View className="flex-1">
          {hasAttachments && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingTop: 6,
                paddingHorizontal: 8,
                paddingBottom: 4,
                gap: 8,
              }}
            >
              {attachments.map((att, index) => (
                <View key={`${att.uri}-${index}`} className="relative">
                  {att.kind === "file" ? (
                    <View
                      className="flex-row items-center gap-1.5 rounded-xl bg-w3 px-3"
                      style={{ height: ATTACHMENT_SIZE, maxWidth: 200 }}
                    >
                      <FileText
                        size={18}
                        color={LIGHT_THEME.wSub}
                        strokeWidth={2}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: "Outfit-Regular",
                          fontSize: 13,
                          color: LIGHT_THEME.wText,
                          maxWidth: 150,
                        }}
                      >
                        {att.name ?? "Document"}
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: att.uri }}
                      className="rounded-xl bg-w3"
                      style={{
                        width: ATTACHMENT_SIZE,
                        height: ATTACHMENT_SIZE,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  {onRemoveAttachment && (
                    <Pressable
                      onPress={() => onRemoveAttachment(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-wText items-center justify-center"
                      hitSlop={6}
                      accessibilityLabel="Remove attachment"
                    >
                      <X size={12} color="#C8FF00" strokeWidth={2.5} />
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
          {/* Text input */}
          <TextInput
            value={value}
            onChangeText={onChange}
            onSubmitEditing={handleSubmitEditing}
            placeholder="Ask your coach..."
            placeholderTextColor={LIGHT_THEME.wMute}
            editable={!disabled}
            multiline
            className="px-2 py-2 text-[16px] text-wText max-h-[120px]"
            style={{ fontFamily: "Outfit-Regular", lineHeight: 16 * 1.55 }}
            returnKeyType="default"
            blurOnSubmit={false}
            autoCapitalize="sentences"
            autoCorrect={true}
            autoComplete="off"
            textContentType="none"
            accessibilityLabel="Message input"
            accessibilityHint="Type a message to your coach"
          />
        </View>

        {/* Right action: Mic (empty) or Send (has text or attachments) */}
        {canSend ? (
          <Animated.View
            key="send"
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
          >
            <AnimatedPressable
              onPress={onSend}
              onPressIn={handleSendPressIn}
              onPressOut={handleSendPressOut}
              disabled={disabled}
              style={[sendAnimStyle, { opacity: disabled ? 0.5 : 1 }]}
              className="w-9 h-9 rounded-full bg-wText items-center justify-center mb-[1px]"
            >
              <ArrowUp size={18} color="#C8FF00" strokeWidth={2.5} />
            </AnimatedPressable>
          </Animated.View>
        ) : (
          <Animated.View
            key="mic"
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
          >
            <Pressable
              onPress={onMicPress}
              disabled={disabled}
              className="w-9 h-9 rounded-full items-center justify-center mb-[1px] active:opacity-60"
            >
              <Mic size={18} color={LIGHT_THEME.wMute} strokeWidth={1.8} />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
