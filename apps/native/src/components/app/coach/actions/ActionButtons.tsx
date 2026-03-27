/**
 * ActionButtons
 *
 * Shared button row for action proposal cards.
 * Shows Accept/Reject in pending state, Retry in error state.
 */

import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import * as Haptics from "expo-haptics";
import type { ActionCardPhase } from "./types";

interface ActionButtonsProps {
  phase: ActionCardPhase;
  onAccept: () => void;
  onReject: () => void;
  onRetry?: () => void;
  acceptLabel?: string;
  rejectLabel?: string;
}

export function ActionButtons({
  phase,
  onAccept,
  onReject,
  onRetry,
  acceptLabel = "Accept",
  rejectLabel = "Not now",
}: ActionButtonsProps) {
  if (phase === "applying") {
    return (
      <Animated.View entering={FadeIn.duration(150)} style={styles.applyingRow}>
        <ActivityIndicator size="small" color={COLORS.ora} />
        <Text style={styles.applyingText}>Applying changes...</Text>
      </Animated.View>
    );
  }

  if (phase === "error" && onRetry) {
    return (
      <Animated.View entering={FadeIn.duration(150)} style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRetry();
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryLabel}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => {
            Haptics.selectionAsync();
            onReject();
          }}
          style={styles.dismissLink}
        >
          <Text style={styles.rejectLabel}>{rejectLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (phase !== "pending") return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onAccept();
        }}
        style={styles.acceptButton}
      >
        <Text style={styles.acceptLabel}>{acceptLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => {
          Haptics.selectionAsync();
          onReject();
        }}
        style={styles.rejectLink}
      >
        <Text style={styles.rejectLabel}>{rejectLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 10,
  },
  acceptButton: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: "center" as const,
  },
  acceptLabel: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700" as const,
  },
  rejectLink: {
    paddingVertical: 10,
    alignItems: "center" as const,
  },
  rejectLabel: {
    color: LIGHT_THEME.wMute,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  retryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.ora,
    alignItems: "center" as const,
  },
  retryLabel: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700" as const,
  },
  dismissLink: {
    paddingVertical: 10,
    alignItems: "center" as const,
  },
  applyingRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: "center" as const,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: 8,
  },
  applyingText: {
    color: LIGHT_THEME.wSub,
    fontSize: 13,
  },
});
