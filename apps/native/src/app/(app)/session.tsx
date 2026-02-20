/**
 * Session Detail Screen Route
 * Story 10.6: Session Detail Screen (Pre-Workout)
 *
 * This screen displays the pre-workout session details.
 * Opens as a full-screen modal from the Plan screen.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { SessionDetailScreen } from "@/components/app/session";
import {
  getSessionDetail,
  getAllSessionDetails,
} from "@/components/app/session/mock-data";

export default function SessionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayIdx: string }>();
  const dayIdx = parseInt(params.dayIdx ?? "3", 10);

  const session = getSessionDetail(dayIdx);
  const allSessions = getAllSessionDetails();

  if (!session) {
    // Fallback if session not found
    router.back();
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  const handleStart = () => {
    router.push({ pathname: "/active-session", params: { dayIdx: String(dayIdx) } });
  };

  return (
    <View className="flex-1 bg-black">
      <SessionDetailScreen
        session={session}
        dayIdx={dayIdx}
        weekSessions={allSessions}
        onBack={handleBack}
        onStart={handleStart}
      />
    </View>
  );
}
