/**
 * CalendarSessionSheet - Bottom sheet showing session details
 * when tapping a session card in the calendar view.
 */

import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import Svg, { Path, Circle } from "react-native-svg";
import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import type { CalSession, CalSessionType } from "./types";
import { SESSION_LABELS } from "./constants";

export interface CalendarSessionSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  session: CalSession | null;
  dateKey: string | null;
}

function SessionTypeIcon({ type, size = 20, color }: { type: CalSessionType; size?: number; color: string }) {
  const sw = 2.5;
  switch (type) {
    case "easy":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={sw} />
          <Path d="M12 8v4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case "specific":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "long":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 17l4-8 4 4 4-6 6 10" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "race":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 4h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 16v3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M8 22h8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export function CalendarSessionSheet({ sheetRef, session, dateKey }: CalendarSessionSheetProps) {
  if (!session || !dateKey) {
    return (
      <BottomSheetModal ref={sheetRef} backgroundColor="#FFFFFF" borderRadius={28}>
        <View />
      </BottomSheetModal>
    );
  }

  const color = SESSION_TYPE_COLORS[session.type];
  const dateLabel = formatDateLabel(dateKey);

  return (
    <BottomSheetModal ref={sheetRef} backgroundColor="#FFFFFF" borderRadius={28}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={[s.accentBar, { backgroundColor: color }]} />
          <View style={s.headerContent}>
            <Text
              className="text-xs font-coach-medium"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {dateLabel} · {session.dur}
            </Text>
            <Text
              className="text-[22px] font-coach-bold"
              style={{ color: LIGHT_THEME.wText, letterSpacing: -0.44 }}
            >
              {session.label}
            </Text>
          </View>
        </View>

        {/* Session details */}
        <View style={s.detailsCard}>
          <View style={s.detailRow}>
            <View style={[s.iconCircle, { backgroundColor: color + "18" }]}>
              <SessionTypeIcon type={session.type} size={18} color={color} />
            </View>
            <View style={s.detailContent}>
              <Text className="text-[13px] font-coach-semibold" style={{ color: LIGHT_THEME.wText }}>
                {SESSION_LABELS[session.type]}
              </Text>
              <Text className="text-[11px] font-coach" style={{ color: LIGHT_THEME.wMute }}>
                Session type
              </Text>
            </View>
          </View>

          <View style={s.separator} />

          <View style={s.metricsRow}>
            <View style={s.metric}>
              <Text className="text-[20px] font-coach-extrabold" style={{ color: LIGHT_THEME.wText, letterSpacing: -0.4 }}>
                {session.km}
              </Text>
              <Text className="text-[11px] font-coach-medium" style={{ color: LIGHT_THEME.wMute }}>
                km
              </Text>
            </View>
            <View style={s.metricDivider} />
            <View style={s.metric}>
              <Text className="text-[20px] font-coach-extrabold" style={{ color: LIGHT_THEME.wText, letterSpacing: -0.4 }}>
                {session.dur}
              </Text>
              <Text className="text-[11px] font-coach-medium" style={{ color: LIGHT_THEME.wMute }}>
                duration
              </Text>
            </View>
            <View style={s.metricDivider} />
            <View style={s.metric}>
              <View style={[s.statusDot, { backgroundColor: session.done ? COLORS.grn : color }]} />
              <Text className="text-[11px] font-coach-medium" style={{ color: LIGHT_THEME.wMute }}>
                {session.done ? "Done" : "Upcoming"}
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        {!session.done && (
          <Pressable
            className="mt-2 py-[16px] px-6 rounded-[16px] flex-row items-center justify-center gap-2.5 active:scale-[0.98]"
            style={s.ctaButton}
          >
            <View style={s.ctaIcon}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M5 3L19 12L5 21Z" fill="#000" />
              </Svg>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Outfit-Bold",
                color: LIGHT_THEME.w1,
              }}
            >
              Start Session
            </Text>
          </Pressable>
        )}
      </View>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  accentBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  detailsCard: {
    backgroundColor: LIGHT_THEME.w2,
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  ctaButton: {
    backgroundColor: LIGHT_THEME.wText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: "center",
    justifyContent: "center",
  },
});
