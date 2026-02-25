/**
 * PhaseTimeline - Horizontal progress bar showing training phases.
 * 18pt tall with pastel proportional segments and a static "today" dot.
 * Reference: cadence-calendar-v2 prototype PhaseTimeline
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { blendWithBg } from "./helpers";
import { PHASES, TODAY_KEY } from "./constants";

/** Static today dot on the timeline */
function TimelineTodayDot({ offset }: { offset: number }) {
  return (
    <View
      style={[
        styles.todayContainer,
        { left: `${offset * 100}%` as any },
      ]}
      pointerEvents="none"
    >
      {/* Vertical line behind dot */}
      <View style={styles.todayLine} />

      {/* Dark dot */}
      <View style={styles.todayDot} />
    </View>
  );
}

export const PhaseTimeline = React.memo(function PhaseTimeline() {
  const { segments, todayOffset } = useMemo(() => {
    const allStart = new Date(PHASES[0].start + "T00:00:00");
    const allEnd = new Date(
      PHASES[PHASES.length - 1].end + "T00:00:00"
    );
    const totalDays = Math.max(
      1,
      (allEnd.getTime() - allStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const todayDate = new Date(TODAY_KEY + "T00:00:00");
    const offset = Math.max(
      0,
      Math.min(
        1,
        (todayDate.getTime() - allStart.getTime()) /
          (1000 * 60 * 60 * 24) /
          totalDays
      )
    );

    const segs = PHASES.map((p) => {
      const start = new Date(p.start + "T00:00:00");
      const end = new Date(p.end + "T00:00:00");
      const days = Math.max(
        1,
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1
      );
      const widthPct = (days / totalDays) * 100;
      return { phase: p, widthPct };
    });

    return { segments: segs, todayOffset: offset };
  }, []);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.barContainer}>
        {segments.map((s, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                width: `${s.widthPct}%` as any,
                backgroundColor: blendWithBg(s.phase.color, 0.3),
                borderRightWidth:
                  i < segments.length - 1 ? 1 : 0,
                borderRightColor: LIGHT_THEME.w2,
              },
            ]}
          >
            {s.widthPct > 10 && (
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: blendWithBg(
                      s.phase.color,
                      0.9,
                      [26, 26, 26]
                    ),
                  },
                ]}
              >
                {s.phase.name}
              </Text>
            )}
          </View>
        ))}

        {/* Today marker */}
        <TimelineTodayDot offset={todayOffset} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  barContainer: {
    flexDirection: "row",
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  segment: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  segmentLabel: {
    fontSize: 7,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  todayContainer: {
    position: "absolute",
    top: -1,
    bottom: -1,
    width: 8,
    marginLeft: -4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  todayLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 3.5,
    width: 1,
    backgroundColor: LIGHT_THEME.wText,
    borderRadius: 1,
    opacity: 0.25,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LIGHT_THEME.wText,
    borderWidth: 1.5,
    borderColor: LIGHT_THEME.w2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});
