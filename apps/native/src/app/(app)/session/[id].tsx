import { useLocalSearchParams, useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { SessionDetailPage } from "@/components/app/session/session-detail-page";
import { DebriefScreen } from "@/components/app/session";

export default function SessionRoute() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();

  const sessionId = id as Id<"plannedSessions">;

  // When opened in debrief mode (from push notification), fetch session data
  const session = useQuery(
    api.training.queries.getSessionById,
    mode === "debrief" ? { sessionId } : "skip",
  );

  // Debrief mode — render DebriefScreen with real backend data
  if (mode === "debrief") {
    // Loading state while session data is being fetched
    if (session === undefined) {
      return (
        <View className="flex-1 bg-black justify-center items-center">
          <ActivityIndicator color="white" />
        </View>
      );
    }

    // Session not found or not completed — fall through to detail page
    if (session && session.status === "completed") {
      return (
        <View className="flex-1 bg-black">
          <DebriefScreen
            session={{
              type: session.sessionTypeDisplay,
              zone: session.targetHeartRateZone
                ? `Z${session.targetHeartRateZone}`
                : "Z2",
              km: session.targetDistanceMeters
                ? session.targetDistanceMeters / 1000
                : 0,
            }}
            elapsedTime={session.actualDurationSeconds ?? 0}
            distanceCovered={
              session.actualDistanceMeters
                ? session.actualDistanceMeters / 1000
                : 0
            }
            onDone={() => router.dismissAll()}
          />
        </View>
      );
    }
  }

  // Default — show session detail page
  return (
    <View className="flex-1 bg-black">
      <SessionDetailPage sessionId={sessionId} />
    </View>
  );
}
