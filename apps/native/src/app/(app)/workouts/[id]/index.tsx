import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { WorkoutDetailPage } from "@/components/app/workout/workout-detail-page";

export default function WorkoutRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-black">
        <WorkoutDetailPage workoutId={id} />
      </View>
    </BottomSheetModalProvider>
  );
}
