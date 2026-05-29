import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { FormField } from "@/components/app/form/field";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import React from "react";
import { Keyboard, Platform, Pressable, View } from "react-native";

type DateFieldMode = "date" | "datetime";

type Props = {
  label: string;
  value?: string;
  onChange: (next: string) => void;
  mode?: DateFieldMode;
  minDate?: string;
  maxDate?: string;
  /**
   * Date the spinner opens on when no value is set yet. Falls back to today.
   * Still clamped into [minDate, maxDate], so it's a hint, not an override.
   */
  defaultDate?: string;
  placeholder?: string;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  error?: string;
  /** Optional explanatory callout shown above the spinner in the iOS sheet. */
  note?: string;
  /** When true, the field can't be opened and is visually dimmed. */
  disabled?: boolean;
  /**
   * Render a calendar/month view instead of the spinner wheel (iOS `inline`,
   * Android `calendar`). Best for picking a specific day; keep `false` for
   * far-ranging dates like a birth date where the wheel is faster.
   */
  calendar?: boolean;
};

function parseValue(s: string, mode: DateFieldMode): Date {
  if (mode === "datetime") return new Date(s);
  const [y, m, d] = s.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function formatValue(d: Date, mode: DateFieldMode): string {
  if (mode === "datetime") return d.toISOString();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDisplay(s: string, mode: DateFieldMode): string {
  if (mode === "datetime") {
    const d = new Date(s);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} · ${hh}:${mins}`;
  }
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function getSeedDate(
  value: string | undefined,
  mode: DateFieldMode,
  minimumDate: Date | undefined,
  maximumDate: Date | undefined,
  defaultDate: string | undefined,
): Date {
  let seed: Date;
  if (value) {
    seed = parseValue(value, mode);
  } else if (defaultDate) {
    seed = parseValue(defaultDate, mode);
  } else {
    seed = new Date();
    if (mode === "date") seed.setHours(0, 0, 0, 0);
  }
  if (minimumDate && seed < minimumDate) return minimumDate;
  if (maximumDate && seed > maximumDate) return maximumDate;
  return seed;
}

export function DateField({
  label,
  value,
  onChange,
  mode = "date",
  minDate,
  maxDate,
  defaultDate,
  placeholder = "Select date",
  minuteInterval = 5,
  error,
  note,
  disabled = false,
  calendar = false,
}: Props) {
  const sheetRef = React.useRef<GorhomBottomSheetModal>(null);
  const [pendingDate, setPendingDate] = React.useState<Date | null>(null);

  const minimumDate = minDate ? parseValue(minDate, mode) : undefined;
  const maximumDate = maxDate ? parseValue(maxDate, mode) : undefined;

  const open = () => {
    Keyboard.dismiss();
    const seed = getSeedDate(value, mode, minimumDate, maximumDate, defaultDate);
    if (Platform.OS === "ios") {
      setPendingDate(seed);
      sheetRef.current?.present();
      return;
    }
    DateTimePickerAndroid.open({
      value: seed,
      mode: "date",
      display: calendar ? "calendar" : "default",
      minimumDate,
      maximumDate,
      onChange: (event, picked) => {
        if (event.type !== "set" || !picked) return;
        if (mode === "date") {
          selectionFeedback();
          onChange(formatValue(picked, "date"));
          return;
        }
        DateTimePickerAndroid.open({
          value: picked,
          mode: "time",
          minimumDate,
          maximumDate,
          minuteInterval,
          is24Hour: true,
          onChange: (timeEvent, timePicked) => {
            if (timeEvent.type !== "set" || !timePicked) return;
            const merged = new Date(picked);
            merged.setHours(
              timePicked.getHours(),
              timePicked.getMinutes(),
              0,
              0,
            );
            selectionFeedback();
            onChange(formatValue(merged, "datetime"));
          },
        });
      },
    });
  };

  const handleConfirm = () => {
    if (pendingDate) {
      selectionFeedback();
      onChange(formatValue(pendingDate, mode));
    }
    sheetRef.current?.dismiss();
  };

  return (
    <FormField label={label} error={error}>
      <Pressable
        onPress={open}
        disabled={disabled}
        className="h-12 flex-row items-center rounded-xl border px-4 active:opacity-80"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderColor: error ? COLORS.red : LIGHT_THEME.wBrd,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: value ? LIGHT_THEME.wText : LIGHT_THEME.wMute }}
        >
          {value ? formatDisplay(value, mode) : placeholder}
        </Text>
      </Pressable>

      {Platform.OS === "ios" && (
        <BottomSheetModal ref={sheetRef}>
          <View className="gap-3 px-4 pb-2 pt-2">
            {note ? (
              <View
                className="flex-row gap-2 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: LIGHT_THEME.w3 }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={LIGHT_THEME.wSub}
                  style={{ marginTop: 1 }}
                />
                <Text
                  className="flex-1 font-coach-medium text-[14px]"
                  style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
                >
                  {note}
                </Text>
              </View>
            ) : null}
            <DateTimePicker
              value={
                pendingDate ??
                getSeedDate(value, mode, minimumDate, maximumDate, defaultDate)
              }
              mode={mode}
              display={calendar ? "inline" : "spinner"}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              minuteInterval={mode === "datetime" ? minuteInterval : undefined}
              onChange={(_, selected) => {
                if (selected) setPendingDate(selected);
              }}
              themeVariant="light"
              style={{ alignSelf: "stretch", height: calendar ? 360 : 216 }}
            />
            <Pressable
              onPress={handleConfirm}
              className="items-center rounded-2xl py-3.5 active:opacity-90"
              style={{ backgroundColor: LIGHT_THEME.wText }}
            >
              <Text
                className="font-coach-bold text-sm"
                style={{ color: "#FFFFFF" }}
              >
                Done
              </Text>
            </Pressable>
          </View>
        </BottomSheetModal>
      )}
    </FormField>
  );
}
