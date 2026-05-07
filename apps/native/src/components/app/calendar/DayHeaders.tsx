/**
 * DayHeaders - Mo Tu We Th Fr Sa Su header row.
 * Reference: cadence-calendar-final.jsx lines 471-480
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { formatDayLabelShort } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";

export const DayHeaders = React.memo(function DayHeaders() {
  const locale = useLanguage();
  const labels = useMemo(() => {
    // 2024-01-01 is a Monday — generate one Mon..Sun label per locale.
    const ref = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ref);
      d.setDate(ref.getDate() + i);
      return formatDayLabelShort(locale, d);
    });
  }, [locale]);

  return (
    <View style={styles.container}>
      {labels.map((d, i) => (
        <View key={i} style={styles.cell}>
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
