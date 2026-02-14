import { OnboardingFlowMock } from "@/components/app/onboarding/OnboardingFlowMock";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { View, ActivityIndicator } from "react-native";

export default function Onboarding() {
  const user = useQuery(api.table.users.currentUser);
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const patchUser = useMutation(api.table.users.patch);

  // Loading state - wait for both queries
  if (user === undefined || runner === undefined) {
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

  return (
    <OnboardingFlowMock
      initialPath="no-data"
      onComplete={handleComplete}
      devMode={__DEV__}
    />
  );
}
