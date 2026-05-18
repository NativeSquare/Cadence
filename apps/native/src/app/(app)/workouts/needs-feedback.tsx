import { View } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { NeedsFeedbackScreen } from "@/components/app/workout/NeedsFeedbackScreen";

export default function NeedsFeedbackRoute() {
  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-black">
        <NeedsFeedbackScreen />
      </View>
    </BottomSheetModalProvider>
  );
}
