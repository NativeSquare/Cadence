import { selectionFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { useRef, useEffect, useState } from "react";
import { Animated, Pressable, TextInput, View } from "react-native";

type ConversationInputProps = {
  /** Placeholder text */
  placeholder?: string;
  /** Pre-set quick response options */
  quickResponses?: string[];
  /** Called when user submits a response */
  onSubmit: (response: string) => void;
  className?: string;
};

export function ConversationInput({
  placeholder = "Type your response...",
  quickResponses,
  onSubmit,
  className,
}: ConversationInputProps) {
  const [text, setText] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = () => {
    if (text.trim()) {
      selectionFeedback();
      onSubmit(text.trim());
      setText("");
    }
  };

  const handleQuickResponse = (response: string) => {
    selectionFeedback();
    onSubmit(response);
  };

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={cn("gap-3", className)}
    >
      {/* Quick responses */}
      {quickResponses && quickResponses.length > 0 && (
        <View className="gap-2">
          {quickResponses.map((response, index) => (
            <Pressable
              key={index}
              onPress={() => handleQuickResponse(response)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 active:bg-white/10"
            >
              <Text className="text-sm text-white/70">{response}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Text input */}
      <View className="flex-row items-center gap-2">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.25)"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-[44px]"
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!text.trim()}
          className={cn(
            "rounded-xl px-4 py-3 items-center justify-center",
            text.trim() ? "bg-primary" : "bg-white/10",
          )}
        >
          <Text
            className={cn(
              "text-sm font-semibold",
              text.trim() ? "text-primary-foreground" : "text-white/30",
            )}
          >
            Send
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/** A single user message bubble shown in the conversation */
export function UserMessage({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={cn("self-end", className)}
    >
      <View className="bg-primary/15 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%]">
        <Text className="text-sm text-white/90">{text}</Text>
      </View>
    </Animated.View>
  );
}
