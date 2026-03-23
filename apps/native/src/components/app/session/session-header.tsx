import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Star } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, FONT_WEIGHTS, SESSION_TYPE_COLORS, getSessionCategory } from "@/lib/design-tokens";

export interface SessionHeaderProps {
  sessionTypeDisplay: string;
  scheduledDate: number;
  status: string;
  isKeySession: boolean;
  isRestDay: boolean;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Upcoming",
  completed: "Completed",
  skipped: "Skipped",
  modified: "Modified",
  rescheduled: "Rescheduled",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "rgba(255,255,255,0.5)",
  completed: "#4ADE80",
  skipped: "#FF9500",
  modified: "#5B9EFF",
  rescheduled: "#FF9500",
};

function formatFullDate(timestamp: number): string {
  const d = new Date(timestamp);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export function SessionHeader({
  sessionTypeDisplay,
  scheduledDate,
  status,
  isKeySession,
  isRestDay,
  onBack,
}: SessionHeaderProps) {
  const insets = useSafeAreaInsets();
  const category = getSessionCategory(sessionTypeDisplay);
  const accentColor = SESSION_TYPE_COLORS[category];
  const dateLabel = formatFullDate(scheduledDate);
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusColor = STATUS_COLORS[status] ?? "rgba(255,255,255,0.5)";

  return (
    <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 20, paddingBottom: 18, backgroundColor: "#000000" }}>
      {/* Top row: back + date + status badge */}
      <View className="flex-row items-center">
        <Pressable onPress={onBack} hitSlop={12} className="p-1 mr-3">
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 13, fontFamily: FONT_WEIGHTS.medium, color: "rgba(255,255,255,0.5)", flex: 1 }}>
          {dateLabel}
        </Text>
        <View
          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusColor }} />
          <Text style={{ fontSize: 11, fontFamily: FONT_WEIGHTS.semibold, color: statusColor }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Session title with dot indicator */}
      <View className="flex-row items-center gap-2.5">
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accentColor }} />
        <Text style={{ fontSize: 26, lineHeight: 36, fontFamily: FONT_WEIGHTS.bold, color: "#FFFFFF", letterSpacing: -0.52, flex: 1 }}>
          {isRestDay ? "Rest Day" : sessionTypeDisplay}
        </Text>
        {isKeySession && (
          <View
            className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(200,255,0,0.15)" }}
          >
            <Star size={11} color="#C8FF00" fill="#C8FF00" />
            <Text style={{ fontSize: 11, fontFamily: FONT_WEIGHTS.semibold, color: "#C8FF00" }}>Key</Text>
          </View>
        )}
      </View>
    </View>
  );
}
