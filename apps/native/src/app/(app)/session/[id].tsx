import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SessionDetailPage } from "@/components/app/session/session-detail-page";

export default function SessionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-black">
        <SessionDetailPage sessionId={id} />
      </View>
    </BottomSheetModalProvider>
  );
}
