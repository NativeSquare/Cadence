import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, FONT_WEIGHTS, CARD_SHADOW } from "@/lib/design-tokens";

interface AdjacentSession {
  sessionTypeDisplay: string;
  targetDistanceMeters?: number;
  isRestDay: boolean;
  status: string;
}

export interface SessionContextCardProps {
  yesterday: AdjacentSession | null;
  tomorrow: AdjacentSession | null;
}

function formatDistance(meters?: number): string {
  if (!meters) return "";
  return ` ${(meters / 1000).toFixed(0)}km`;
}

function getStatusIcon(status: string, isRestDay: boolean): string {
  if (isRestDay) return "Rest day";
  if (status === "completed") return "Completed";
  if (status === "skipped") return "Skipped";
  return "";
}

function AdjacentRow({
  label,
  session,
}: {
  label: string;
  session: AdjacentSession | null;
}) {
  if (!session) return null;

  const detail = session.isRestDay
    ? "Rest day"
    : `${session.sessionTypeDisplay}${formatDistance(session.targetDistanceMeters)}`;

  const statusText = getStatusIcon(session.status, session.isRestDay);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text
        style={{
          fontSize: 12,
          fontFamily: FONT_WEIGHTS.semibold,
          color: LIGHT_THEME.wMute,
          width: 70,
        }}
      >
        {label}:
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontFamily: FONT_WEIGHTS.medium,
          color: LIGHT_THEME.wText,
          flex: 1,
        }}
      >
        {detail}
      </Text>
      {statusText && session.status !== "scheduled" && (
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONT_WEIGHTS.medium,
            color: LIGHT_THEME.wMute,
          }}
        >
          {statusText}
        </Text>
      )}
    </View>
  );
}

export function SessionContextCard({
  yesterday,
  tomorrow,
}: SessionContextCardProps) {
  if (!yesterday && !tomorrow) return null;

  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Training Context
      </Text>
      <View
        className="rounded-2xl bg-w1 p-4"
        style={{ ...CARD_SHADOW, gap: 10 }}
      >
        <AdjacentRow label="Yesterday" session={yesterday} />
        <AdjacentRow label="Tomorrow" session={tomorrow} />
      </View>
    </View>
  );
}
