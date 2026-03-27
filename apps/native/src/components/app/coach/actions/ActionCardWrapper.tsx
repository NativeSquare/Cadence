/**
 * ActionCardWrapper
 *
 * Shared wrapper for all action proposal cards. Provides the
 * phase-based border color, header bar, and layout structure.
 */

import { View, ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import type { ActionCardPhase } from "./types";
import {
  CalendarClock,
  Check,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react-native";

// =============================================================================
// Phase Styles
// =============================================================================

interface PhaseStyle {
  borderColor: string;
  headerBg: string;
  headerTextColor: string;
  icon: React.ReactNode;
}

const ICON_SIZE = 16;

function getPhaseStyle(phase: ActionCardPhase, title: string): PhaseStyle {
  switch (phase) {
    case "streaming":
      return {
        borderColor: LIGHT_THEME.wBrd,
        headerBg: "rgba(0,0,0,0.03)",
        headerTextColor: LIGHT_THEME.wMute,
        icon: <ActivityIndicator size="small" color={LIGHT_THEME.wMute} />,
      };
    case "pending":
      return {
        borderColor: COLORS.ora,
        headerBg: "rgba(255,149,0,0.08)",
        headerTextColor: COLORS.ora,
        icon: <CalendarClock size={ICON_SIZE} color={COLORS.ora} />,
      };
    case "applying":
      return {
        borderColor: "rgba(255,149,0,0.4)",
        headerBg: "rgba(255,149,0,0.08)",
        headerTextColor: "rgba(255,149,0,0.6)",
        icon: <ActivityIndicator size="small" color={COLORS.ora} />,
      };
    case "accepted":
      return {
        borderColor: COLORS.grn,
        headerBg: "rgba(74,222,128,0.08)",
        headerTextColor: COLORS.grn,
        icon: <Check size={ICON_SIZE} color={COLORS.grn} />,
      };
    case "rejected":
      return {
        borderColor: LIGHT_THEME.wBrd,
        headerBg: "rgba(0,0,0,0.04)",
        headerTextColor: LIGHT_THEME.wMute,
        icon: <X size={ICON_SIZE} color={LIGHT_THEME.wMute} />,
      };
    case "expired":
      return {
        borderColor: LIGHT_THEME.wBrd,
        headerBg: "rgba(0,0,0,0.04)",
        headerTextColor: LIGHT_THEME.wMute,
        icon: <Clock size={ICON_SIZE} color={LIGHT_THEME.wMute} />,
      };
    case "error":
      return {
        borderColor: COLORS.red,
        headerBg: "rgba(255,90,90,0.08)",
        headerTextColor: COLORS.red,
        icon: <AlertTriangle size={ICON_SIZE} color={COLORS.red} />,
      };
  }
}

// =============================================================================
// Component
// =============================================================================

interface ActionCardWrapperProps {
  phase: ActionCardPhase;
  title: string;
  /** Compact one-line summary shown in accepted/rejected states */
  summary?: string;
  /** Error message for error state */
  errorMessage?: string;
  children: React.ReactNode;
}

export function ActionCardWrapper({
  phase,
  title,
  summary,
  errorMessage,
  children,
}: ActionCardWrapperProps) {
  const style = getPhaseStyle(phase, title);
  const isCollapsed = phase === "accepted" || phase === "rejected" || phase === "expired";

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        borderWidth: 1,
        borderColor: style.borderColor,
        borderRadius: 16,
        overflow: "hidden",
        marginVertical: 8,
      }}
    >
      {/* Header Bar */}
      <View
        style={{
          backgroundColor: style.headerBg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        {style.icon}
        <Text
          style={{
            color: style.headerTextColor,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      </View>

      {/* Content Area */}
      {isCollapsed ? (
        <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
          <Text
            style={{
              color: phase === "accepted" ? LIGHT_THEME.wText : LIGHT_THEME.wMute,
              fontSize: 14,
              opacity: phase === "rejected" || phase === "expired" ? 0.5 : 1,
            }}
          >
            {phase === "expired"
              ? "This suggestion is no longer available — the schedule has changed."
              : summary ?? title}
          </Text>
        </View>
      ) : (
        <View style={{ backgroundColor: LIGHT_THEME.w1 }}>
          {children}

          {/* Error message */}
          {phase === "error" && errorMessage && (
            <Animated.View
              entering={FadeIn.duration(150)}
              style={{
                paddingHorizontal: 14,
                paddingBottom: 12,
              }}
            >
              <Text style={{ color: COLORS.red, fontSize: 13 }}>{errorMessage}</Text>
            </Animated.View>
          )}
        </View>
      )}
    </Animated.View>
  );
}
