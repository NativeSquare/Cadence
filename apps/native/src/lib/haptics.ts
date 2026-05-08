import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const isHapticsAvailable = Platform.OS === "ios" || Platform.OS === "android";

export function selectionFeedback() {
  if (!isHapticsAvailable) return;
  Haptics.selectionAsync();
}
