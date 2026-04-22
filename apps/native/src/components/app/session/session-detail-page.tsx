/**
 * Session detail page.
 *
 * The full page read a Cadence `plannedSessions` doc (justification, structure
 * segments, alternatives, adherence, etc.) and composed a rich experience. That
 * shape no longer exists — agoge stores the workout with `description` + a
 * step-tree `structure`. The page will be rebuilt against the agoge workout
 * shape. Until then this stub renders a placeholder so routing still works.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

export interface SessionDetailPageProps {
  sessionId: string;
}

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: LIGHT_THEME.bg,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          color: LIGHT_THEME.wText,
          textAlign: "center",
        }}
      >
        Session details are being rebuilt on the new training engine.
      </Text>
      <Text
        style={{
          fontSize: 12,
          marginTop: 12,
          color: LIGHT_THEME.wMute,
        }}
      >
        Workout id: {sessionId}
      </Text>
    </View>
  );
}

export default SessionDetailPage;
