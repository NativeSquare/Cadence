import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
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
      <View className="flex-row items-center justify-between">
        {/* Left: back arrow + stacked date & session type */}
        <View className="flex-row items-center flex-1">
          <Pressable onPress={onBack} hitSlop={12} className="p-1 mr-3">
            <ArrowLeft size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: FONT_WEIGHTS.medium, color: "rgba(255,255,255,0.5)" }}>
              {dateLabel}
            </Text>
            <View className="flex-row items-center gap-2" style={{ marginTop: 2 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accentColor }} />
              <Text style={{ fontSize: 24, lineHeight: 30, fontFamily: FONT_WEIGHTS.bold, color: "#FFFFFF", letterSpacing: -0.4 }}>
                {isRestDay ? "Rest Day" : sessionTypeDisplay}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: status badge */}
        <View
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${statusColor}18` }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
          <Text style={{ fontSize: 13, fontFamily: FONT_WEIGHTS.semibold, color: statusColor }}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}
