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

type Props = {
  label: string;
  value?: string;
  onChange: (next: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
};

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDisplay(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function getSeedDate(
  value: string | undefined,
  minDate: string | undefined,
  maxDate: string | undefined,
): Date {
  if (value) return parseYmd(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (minDate) {
    const min = parseYmd(minDate);
    if (today < min) return min;
  }
  if (maxDate) {
    const max = parseYmd(maxDate);
    if (today > max) return max;
  }
  return today;
}

export function DateField({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
}: Props) {
  const sheetRef = React.useRef<GorhomBottomSheetModal>(null);
  const [pendingDate, setPendingDate] = React.useState<Date | null>(null);

  const minimumDate = minDate ? parseYmd(minDate) : undefined;
  const maximumDate = maxDate ? parseYmd(maxDate) : undefined;

  const open = () => {
    Keyboard.dismiss();
    const seed = getSeedDate(value, minDate, maxDate);
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
      onChange: (event, selected) => {
        if (event.type === "set" && selected) {
          selectionFeedback();
          onChange(formatYmd(selected));
        }
      },
    });
  };

  const handleConfirm = () => {
    if (pendingDate) {
      selectionFeedback();
      onChange(formatYmd(pendingDate));
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
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </Pressable>

      {Platform.OS === "ios" && (
        <BottomSheetModal ref={sheetRef}>
          <View className="gap-3 px-4 pb-2 pt-2">
            <DateTimePicker
              value={pendingDate ?? getSeedDate(value, minDate, maxDate)}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
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
