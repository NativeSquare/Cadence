import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

const PICKER_HEIGHT = 216;

function ColumnLabel({ label }: { label: string }) {
  return (
    <Text
      className="mt-1 text-center font-coach-semibold text-[11px] uppercase"
      style={{ color: LIGHT_THEME.wSub, letterSpacing: 0.05 * 11 }}
    >
      {label}
    </Text>
  );
}

function WheelColumn({
  count,
  value,
  onSelect,
}: {
  count: number;
  value: number;
  onSelect: (v: number) => void;
}) {
  // Track the spinner's position locally so we only ever feed the native
  // picker values it has itself reported. Driving selectedValue straight from
  // parent state lags a frame behind a flick, and the native wheel snaps back
  // to that stale value mid-deceleration — the "re-rolling" glitch.
  const [selected, setSelected] = useState(value);

  // Re-seed when the value changes from outside (e.g. the sheet reopens).
  useEffect(() => {
    setSelected(value);
  }, [value]);

  return (
    <Picker
      selectedValue={selected}
      onValueChange={(v) => {
        const next = typeof v === "number" ? v : Number(v);
        setSelected(next);
        if (next !== value) {
          selectionFeedback();
          onSelect(next);
        }
      }}
      style={{ flex: 1, height: PICKER_HEIGHT }}
      itemStyle={{
        fontSize: 22,
        fontFamily: "Outfit-Bold",
        color: LIGHT_THEME.wText,
      }}
    >
      {Array.from({ length: count }, (_, n) => (
        <Picker.Item key={n} label={String(n).padStart(2, "0")} value={n} />
      ))}
    </Picker>
  );
}

export type TimeWheelValue = {
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * Three native picker columns (hours / minutes / seconds) for entering a
 * finish time. Real platform wheels via @react-native-picker/picker —
 * UIPickerView on iOS, NumberPicker/dropdown on Android. Values are plain
 * integers; the parent owns formatting.
 */
export function TimeWheel({
  hours,
  minutes,
  seconds,
  onChange,
  labels,
  maxHours = 23,
}: {
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (next: TimeWheelValue) => void;
  labels: { hours: string; minutes: string; seconds: string };
  maxHours?: number;
}) {
  const value: TimeWheelValue = { hours, minutes, seconds };
  return (
    <View
      className="rounded-2xl px-2 py-1"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderWidth: 1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View
        className="flex-row"
        style={Platform.OS === "android" ? { paddingVertical: 8 } : undefined}
      >
        <WheelColumn
          count={maxHours + 1}
          value={hours}
          onSelect={(h) => onChange({ ...value, hours: h })}
        />
        <WheelColumn
          count={60}
          value={minutes}
          onSelect={(m) => onChange({ ...value, minutes: m })}
        />
        <WheelColumn
          count={60}
          value={seconds}
          onSelect={(s) => onChange({ ...value, seconds: s })}
        />
      </View>
      <View className="flex-row">
        <View className="flex-1">
          <ColumnLabel label={labels.hours} />
        </View>
        <View className="flex-1">
          <ColumnLabel label={labels.minutes} />
        </View>
        <View className="flex-1">
          <ColumnLabel label={labels.seconds} />
        </View>
      </View>
    </View>
  );
}
