import { View } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";

interface StructureSegment {
  segmentType: string;
  durationSeconds?: number;
  distanceMeters?: number;
  targetPace?: string;
  targetHeartRate?: number;
  targetEffort?: number;
  repetitions?: number;
  recoverySeconds?: number;
  notes?: string;
}

export interface SessionStructureProps {
  segments: StructureSegment[];
  structureDisplay?: string;
}

const SEGMENT_COLORS: Record<string, string> = {
  warmup: "#5B9EFF",
  cooldown: "#5B9EFF",
  recovery: "#A8D900",
  main: "#FF9500",
  work: "#FF9500",
};

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${Math.round(seconds / 60)} min`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters}m`;
}

function segmentLabel(seg: StructureSegment): string {
  const type = seg.segmentType.charAt(0).toUpperCase() + seg.segmentType.slice(1).replace(/_/g, " ");
  if (seg.repetitions && seg.repetitions > 1) {
    const dist = seg.distanceMeters ? formatDistance(seg.distanceMeters) : "";
    return `${seg.repetitions} × ${dist || type}`;
  }
  return type;
}

function segmentDetail(seg: StructureSegment): string {
  const parts: string[] = [];
  if (seg.durationSeconds) parts.push(formatDuration(seg.durationSeconds));
  if (seg.distanceMeters && !seg.repetitions) parts.push(formatDistance(seg.distanceMeters));
  if (seg.targetPace) parts.push(`${seg.targetPace}/km`);
  if (seg.targetEffort) parts.push(`Effort ${seg.targetEffort}/10`);
  if (seg.recoverySeconds) parts.push(`${Math.round(seg.recoverySeconds / 60)} min recovery`);
  return parts.join(" · ");
}

function SegmentRow({ segment, index, isLast }: { segment: StructureSegment; index: number; isLast: boolean }) {
  const color = SEGMENT_COLORS[segment.segmentType] ?? LIGHT_THEME.wMute;

  return (
    <Animated.View
      entering={FadeInLeft.duration(350).delay(index * 60).withInitialValues({ opacity: 0, transform: [{ translateX: -10 }] })}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: LIGHT_THEME.wBrd,
      }}
    >
      <View style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: color, marginRight: 14 }} />
      <View className="flex-1">
        <Text style={{ fontSize: 15, fontFamily: FONT_WEIGHTS.semibold, color: LIGHT_THEME.wText }}>
          {segmentLabel(segment)}
        </Text>
        <Text style={{ fontSize: 12, color: LIGHT_THEME.wMute, marginTop: 2 }}>
          {segmentDetail(segment)}
        </Text>
        {segment.notes && (
          <Text style={{ fontSize: 12, color: LIGHT_THEME.wSub, marginTop: 4, fontStyle: "italic" }}>
            {segment.notes}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export function SessionStructure({ segments, structureDisplay }: SessionStructureProps) {
  if (segments.length === 0 && !structureDisplay) return null;

  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wMute uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Workout Structure
      </Text>

      {segments.length > 0 ? (
        <View className="rounded-[20px] bg-w1 border border-wBrd overflow-hidden">
          {segments.map((seg, i) => (
            <SegmentRow key={`${seg.segmentType}-${i}`} segment={seg} index={i} isLast={i === segments.length - 1} />
          ))}
        </View>
      ) : structureDisplay ? (
        <View className="rounded-[20px] bg-w1 border border-wBrd p-4">
          <Text style={{ fontSize: 14, color: LIGHT_THEME.wText, lineHeight: 20 }}>
            {structureDisplay}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
