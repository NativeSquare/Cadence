/**
 * CoachScreen - Main container for the Coach/Chat tab
 *
 * Manages conversation lifecycle (load/create) and delegates
 * to CoachChatView once the conversation is ready.
 *
 * Source: Story 10.3 - AC#1, AC#2, AC#3, AC#4, AC#5
 */

import { View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useCoachChat } from "@/hooks/use-coach-chat";
import { CoachChatView } from "./CoachChatView";

export function CoachScreen({ initialPrompt }: { initialPrompt?: string }) {
  const insets = useSafeAreaInsets();
  const {
    phase,
    conversationId,
    initialMessages,
    persistUserMessage,
    persistAssistantMessage,
  } = useCoachChat();

  if (phase === "loading") {
    return (
      <View
        className="flex-1 bg-black items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="small" color="#A3E635" />
        <Text className="text-g3 text-sm mt-3 font-coach">
          Loading conversation...
        </Text>
      </View>
    );
  }

  if (phase === "error" || !conversationId) {
    return (
      <View
        className="flex-1 bg-black items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-g3 text-sm font-coach">
          Unable to start conversation. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <CoachChatView
      key={conversationId}
      conversationId={conversationId}
      initialHistory={initialMessages}
      persistUserMessage={persistUserMessage}
      persistAssistantMessage={persistAssistantMessage}
      initialPrompt={initialPrompt}
    />
  );
}
