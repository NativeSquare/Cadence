import * as Updates from "expo-updates";
import i18n from "i18next";
import { Alert } from "react-native";

export async function checkForUpdates() {
  // Only check for updates in production builds
  if (!Updates.isEnabled) {
    return;
  }

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      Alert.alert(
        i18n.t("updates.available.title"),
        i18n.t("updates.available.message"),
        [
          {
            text: i18n.t("updates.available.later"),
            style: "cancel",
          },
          {
            text: i18n.t("updates.available.updateNow"),
            onPress: async () => {
              try {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              } catch (error) {
                Alert.alert(
                  i18n.t("updates.failed.title"),
                  i18n.t("updates.failed.message", { error: String(error) })
                );
              }
            },
          },
        ]
      );
    }
  } catch (error) {
    // Silently fail in production - we don't want to interrupt the user experience
    if (__DEV__) {
      console.error("Error checking for updates:", error);
    }
  }
}
