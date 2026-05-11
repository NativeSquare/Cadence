import { View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { useCoachAgentThread } from "@/hooks/use-coach-agent-thread";
import { CoachChatView } from "./CoachChatView";

export function CoachScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { phase, threadId } = useCoachAgentThread();

  if (phase === "loading") {
    return (
      <View
        className="flex-1 bg-black items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="small" color="#A3E635" />
        <Text className="text-g3 text-sm mt-3 font-coach">
          {t("coach.loadingConversation")}
        </Text>
      </View>
    );
  }

  if (phase === "error" || !threadId) {
    return (
      <View
        className="flex-1 bg-black items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-g3 text-sm font-coach">
          {t("coach.unableToStart")}
        </Text>
      </View>
    );
  }

  return <CoachChatView key={threadId} threadId={threadId} />;
}
