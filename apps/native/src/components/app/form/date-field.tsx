import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { FormField } from "@/components/app/form/field";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
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
  placeholder?: string;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
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
): Date {
  let seed: Date;
  if (value) {
    seed = parseValue(value, mode);
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
  placeholder = "Select date",
  minuteInterval = 5,
}: Props) {
  const sheetRef = React.useRef<GorhomBottomSheetModal>(null);
  const [pendingDate, setPendingDate] = React.useState<Date | null>(null);

  const minimumDate = minDate ? parseValue(minDate, mode) : undefined;
  const maximumDate = maxDate ? parseValue(maxDate, mode) : undefined;

  const open = () => {
    Keyboard.dismiss();
    const seed = getSeedDate(value, mode, minimumDate, maximumDate);
    if (Platform.OS === "ios") {
      setPendingDate(seed);
      sheetRef.current?.present();
      return;
    }
    DateTimePickerAndroid.open({
      value: seed,
      mode: "date",
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
    <FormField label={label}>
      <Pressable
        onPress={open}
        className="h-12 flex-row items-center rounded-xl border px-4 active:opacity-80"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderColor: LIGHT_THEME.wBrd,
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
            <DateTimePicker
              value={
                pendingDate ??
                getSeedDate(value, mode, minimumDate, maximumDate)
              }
              mode={mode}
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              minuteInterval={mode === "datetime" ? minuteInterval : undefined}
              onChange={(_, selected) => {
                if (selected) setPendingDate(selected);
              }}
              themeVariant="light"
              style={{ alignSelf: "stretch", height: 216 }}
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
