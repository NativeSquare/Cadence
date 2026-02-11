import { OnboardingFlow } from "@/components/app/onboarding/onboarding-flow";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export default function Onboarding() {
  const user = useQuery(api.table.users.currentUser);
  const patchUser = useMutation(api.table.users.patch);

  const handleComplete = () => {
    if (!user?._id) return;
    patchUser({ id: user._id, data: { hasCompletedOnboarding: true } });
  };

  const displayName = user?.name?.split(" ")[0] || "there";

  return <OnboardingFlow userName={displayName} onComplete={handleComplete} />;
}
