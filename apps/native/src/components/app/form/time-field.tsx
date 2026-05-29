import { FormField } from "@/components/app/form/field";
import {
  TimeWheel,
  type TimeWheelValue,
} from "@/components/app/form/time-wheel";
import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { Keyboard, Pressable, View } from "react-native";

type Props = {
  label: string;
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (next: TimeWheelValue) => void;
  labels: { hours: string; minutes: string; seconds: string };
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  maxHours?: number;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatClock(hours: number, minutes: number, seconds: number): string {
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/**
 * Finish-time field: a tappable row that opens a bottom sheet with a 3-column
 * (h/m/s) wheel, mirroring DateField. The sheet disables content panning so
 * the wheel's own scroll gestures aren't swallowed.
 */
export function TimeField({
  label,
  hours,
  minutes,
  seconds,
  onChange,
  labels,
  placeholder = "Select time",
  error,
  disabled = false,
  maxHours,
}: Props) {
  const sheetRef = React.useRef<GorhomBottomSheetModal>(null);
  const [pending, setPending] = React.useState<TimeWheelValue>({
    hours,
    minutes,
    seconds,
  });

  const hasValue = hours + minutes + seconds > 0;

  const open = () => {
    Keyboard.dismiss();
    setPending({ hours, minutes, seconds });
    sheetRef.current?.present();
  };

  const handleConfirm = () => {
    selectionFeedback();
    onChange(pending);
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
          style={{ color: hasValue ? LIGHT_THEME.wText : LIGHT_THEME.wMute }}
        >
          {hasValue ? formatClock(hours, minutes, seconds) : placeholder}
        </Text>
      </Pressable>

      <BottomSheetModal ref={sheetRef} enableContentPanningGesture={false}>
        <View className="gap-3 px-4 pb-2 pt-2">
          <TimeWheel
            hours={pending.hours}
            minutes={pending.minutes}
            seconds={pending.seconds}
            onChange={setPending}
            labels={labels}
            maxHours={maxHours}
          />
          <Pressable
            onPress={handleConfirm}
            className="items-center rounded-2xl py-3.5 active:opacity-90"
            style={{ backgroundColor: LIGHT_THEME.wText }}
          >
            <Text className="font-coach-bold text-sm" style={{ color: "#FFFFFF" }}>
              Done
            </Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </FormField>
  );
}
