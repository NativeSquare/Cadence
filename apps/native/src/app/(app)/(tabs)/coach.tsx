import { useLocalSearchParams } from "expo-router";
import { CoachScreen } from "@/components/app/coach";

export default function Coach() {
  const { workoutContext } = useLocalSearchParams<{
    workoutContext?: string;
  }>();
  return <CoachScreen initialPrompt={workoutContext} />;
}
