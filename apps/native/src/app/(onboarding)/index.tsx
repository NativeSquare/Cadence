import { OnboardingFlowMock } from "@/components/app/onboarding/OnboardingFlowMock";
import { OfflineScreen } from "@/components/common/OfflineScreen";
import { useNetwork } from "@/contexts/network-context";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { View, ActivityIndicator } from "react-native";

export default function Onboarding() {
  const { isOffline, status } = useNetwork();
  const user = useQuery(api.table.users.currentUser);
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const patchUser = useMutation(api.table.users.patch);

  // Show offline screen immediately if no network (AC#3: no loading then error)
  if (isOffline) {
    return <OfflineScreen />;
  }

  // Loading state - wait for both queries
  if (user === undefined || runner === undefined || status === "unknown") {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center">
        <ActivityIndicator color="#a3e635" />
      </View>
    );
  }

  const handleComplete = (result: { startedTrial: boolean }) => {
    if (!user?._id) return;
    patchUser({ id: user._id, data: { hasCompletedOnboarding: true } });
  };

  // Runner name is source of truth, fallback to auth provider name
  const userName = runner?.identity?.name || user?.name || "";

  return (
    <OnboardingFlowMock
      initialPath="no-data"
      userName={userName}
      onComplete={handleComplete}
    />
  );
}
