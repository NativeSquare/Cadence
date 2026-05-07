import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function Onboarding() {
  const { t } = useTranslation();
  const user = useQuery(api.table.users.currentUser);
  const patchUser = useMutation(api.table.users.patch);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await patchUser({
        id: user._id,
        data: { hasCompletedOnboarding: true },
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center px-6 gap-3">
      <Text variant="h2" className="border-b-0 text-center">
        {t("onboarding.comingSoonTitle")}
      </Text>
      <Text className="text-center text-muted-foreground">
        {t("onboarding.comingSoonHelper")}
      </Text>
      <Button
        size="lg"
        className="mt-6 w-full max-w-xs"
        onPress={handleContinue}
        disabled={!user || isSubmitting}
      >
        <Text>{t("common.continue")}</Text>
      </Button>
    </View>
  );
}
