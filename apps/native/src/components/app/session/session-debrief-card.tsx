/**
 * Session debrief card — stubbed during agoge migration.
 * Will be rebuilt to submit debrief via api.plan.actions.submitWorkoutDebrief.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

export interface SessionDebriefCardProps {
  sessionId: string;
  userRating?: number;
  userFeedback?: string;
  debriefTags?: string[];
}

export function SessionDebriefCard({ sessionId }: SessionDebriefCardProps) {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: LIGHT_THEME.card,
        borderRadius: 12,
      }}
    >
      <Text style={{ color: LIGHT_THEME.wMute }}>
        Debrief for workout {sessionId} — coming soon.
      </Text>
    </View>
  );
}

export default SessionDebriefCard;
