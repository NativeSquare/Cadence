import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Cadence Haptic Language
 *
 * Three haptic "notes" define Cadence's body language:
 * - Arrival pulse: Soft, warm. "I'm here."
 * - Insight tap: Slightly sharper. "Pay attention."
 * - Question pause: Different texture. "Your turn."
 */

const isHapticsAvailable = Platform.OS === "ios" || Platform.OS === "android";

/** Soft, warm pulse — Cadence begins speaking. "I'm here." */
export function arrivalPulse() {
  if (!isHapticsAvailable) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Slightly sharper tap — Landing on something important. "Pay attention." */
export function insightTap() {
  if (!isHapticsAvailable) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Different texture — Asking the user something. "Your turn." */
export function questionPause() {
  if (!isHapticsAvailable) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Light selection feedback for UI interactions */
export function selectionFeedback() {
  if (!isHapticsAvailable) return;
  Haptics.selectionAsync();
}
