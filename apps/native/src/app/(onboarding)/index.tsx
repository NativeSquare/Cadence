import { OnboardingFlow } from "@/components/app/onboarding/OnboardingFlow";
import { OfflineScreen } from "@/components/common/OfflineScreen";
import { useNetwork } from "@/contexts/network-context";
import { View, ActivityIndicator } from "react-native";

export default function Onboarding() {
  const { isOffline, status } = useNetwork();

  // Show offline screen immediately if no network (AC#3: no loading then error)
  if (isOffline) {
    return <OfflineScreen />;
  }

  if (status === "unknown") {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center">
        <ActivityIndicator color="#a3e635" />
      </View>
    );
  }

  return <OnboardingFlow />;
}
