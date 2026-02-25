/**
 * DayHeaders - Mo Tu We Th Fr Sa Su header row.
 * Reference: cadence-calendar-final.jsx lines 471-480
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { DAY_HEADERS } from "./constants";

export const DayHeaders = React.memo(function DayHeaders() {
  return (
    <View style={styles.container}>
      {DAY_HEADERS.map((d, i) => (
        <View key={d} style={styles.cell}>
          <Text
            style={[
              styles.label,
              i >= 5 && styles.weekend,
            ]}
          >
            {d}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 3,
    paddingTop: 6,
    paddingBottom: 2,
  },
  cell: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: LIGHT_THEME.wMute,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  weekend: {
    opacity: 0.56,
  },
});
