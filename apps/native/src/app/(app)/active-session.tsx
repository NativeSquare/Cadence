/**
 * Active Session Screen Route
 * Story 10.6: Active Workout tracking screen
 *
 * This screen shows during an active workout with timer,
 * distance, pace, and heart rate tracking.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { ActiveSessionScreen, DebriefScreen } from "@/components/app/session";
import { getSessionDetail } from "@/components/app/session/mock-data";
import { useState } from "react";

export default function ActiveSessionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayIdx: string }>();
  const dayIdx = parseInt(params.dayIdx ?? "3", 10);

  const session = getSessionDetail(dayIdx);

  // Track if session ended to show debrief
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionData, setSessionData] = useState<{
    elapsed: number;
    distance: number;
  } | null>(null);

  if (!session) {
    router.back();
    return null;
  }

  const handleStop = (data: { elapsed: number; distance: number }) => {
    setSessionData(data);
    setSessionEnded(true);
  };

  const handleDebriefDone = () => {
    // Navigate back to Plan screen
    router.dismissAll();
  };

  // Show debrief after session ends
  if (sessionEnded && sessionData) {
    return (
      <View className="flex-1 bg-black">
        <DebriefScreen
          session={{
            type: session.type,
            zone: session.zone,
            km: parseFloat(session.km) || 0,
          }}
          elapsedTime={sessionData.elapsed}
          distanceCovered={sessionData.distance}
          onDone={handleDebriefDone}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ActiveSessionScreen
        session={{
          type: session.type,
          km: session.km,
          segments: session.segments,
        }}
        onStop={handleStop}
      />
    </View>
  );
}
