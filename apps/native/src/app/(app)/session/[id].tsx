import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { SessionDetailPage } from "@/components/app/session/session-detail-page";

export default function SessionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-black">
      <SessionDetailPage sessionId={id} />
    </View>
  );
}
