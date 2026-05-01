import { Input } from "@/components/ui/input";
import { COLORS } from "@/lib/design-tokens";
import { ZoneKind } from "@nativesquare/agoge/schema";

export type ZoneNumberInputProps = {
  kind: ZoneKind;
  value: string;
  onChangeText: (v: string) => void;
  editable: boolean;
  invalid?: boolean;
};

export function ZoneNumberInput({
  kind,
  value,
  onChangeText,
  editable,
  invalid,
}: ZoneNumberInputProps) {
  return (
    <Input
      className={"h-9 w-14 text-center font-coach-medium text-[13px]"}
      style={invalid ? { borderColor: COLORS.red, borderWidth: 1 } : undefined}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={kind === "hr" ? "number-pad" : "numbers-and-punctuation"}
      maxLength={kind === "hr" ? 3 : 5}
    />
  );
}
