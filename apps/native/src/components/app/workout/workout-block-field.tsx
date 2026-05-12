import { FormField } from "@/components/app/form";
import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { useLanguage, type Language } from "@/lib/i18n";
import { blockLabel } from "@/components/app/workout/workout-helpers";
import type { BlockDoc } from "@nativesquare/agoge/schema";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { BLOCK_TYPE_COLORS } from "@packages/shared/colors";
import type { TFunction } from "i18next";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function formatBlockRange(
  locale: Language,
  startYmd: string,
  endYmd: string,
): string {
  const s = parseYmd(startYmd);
  const e = parseYmd(endYmd);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sOpts: Intl.DateTimeFormatOptions = sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" };
  const start = new Intl.DateTimeFormat(locale, sOpts).format(s);
  const end = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(e);
  return `${start} → ${end}`;
}

export function WorkoutBlockField<T extends FieldValues>({
  control,
  blocks,
}: {
  control: Control<T>;
  blocks: BlockDoc[];
}) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const c = control as unknown as Control<FieldValues>;
  const sheetRef = React.useRef<GorhomBottomSheetModal>(null);

  return (
    <Controller
      control={c}
      name="blockId"
      render={({ field, fieldState }) => {
        const selectedId: string | null = field.value ?? null;
        const selected = selectedId
          ? blocks.find((b) => b._id === selectedId) ?? null
          : null;

        // Include current+future blocks. The currently-selected block is kept
        // even if past, so editing an existing workout still shows its block
        // in the list (without it the user couldn't see what's selected).
        const today = todayYmd();
        const visibleBlocks = blocks
          .filter(
            (b) =>
              b.endDate >= today ||
              (selectedId != null && b._id === selectedId),
          )
          .sort((a, b) => a.startDate.localeCompare(b.startDate));

        return (
          <FormField
            label={t("workout.fields.blockOptional")}
            error={fieldState.error?.message}
          >
            <Pressable
              onPress={() => {
                selectionFeedback();
                sheetRef.current?.present();
              }}
              className="flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              <BlockDot
                color={
                  selected
                    ? BLOCK_TYPE_COLORS[selected.type]
                    : LIGHT_THEME.wMute
                }
              />
              <View className="flex-1 gap-0.5">
                <Text
                  className="font-coach-bold text-[15px]"
                  style={{ color: LIGHT_THEME.wText }}
                  numberOfLines={1}
                >
                  {selected
                    ? blockLabel(t, selected)
                    : t("workout.fields.blockNone")}
                </Text>
                {selected && (
                  <Text
                    className="font-coach text-[12px]"
                    style={{ color: LIGHT_THEME.wMute }}
                    numberOfLines={1}
                  >
                    {formatBlockRange(
                      locale,
                      selected.startDate,
                      selected.endDate,
                    )}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-down"
                size={18}
                color={LIGHT_THEME.wMute}
              />
            </Pressable>

            <BlockPickerSheet
              sheetRef={sheetRef}
              blocks={visibleBlocks}
              selectedId={selectedId}
              locale={locale}
              t={t}
              onPick={(id) => {
                selectionFeedback();
                field.onChange(id);
                sheetRef.current?.dismiss();
              }}
            />
          </FormField>
        );
      }}
    />
  );
}

function BlockDot({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
      }}
    />
  );
}

function BlockPickerSheet({
  sheetRef,
  blocks,
  selectedId,
  locale,
  t,
  onPick,
}: {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  blocks: BlockDoc[];
  selectedId: string | null;
  locale: Language;
  t: TFunction;
  onPick: (id: string | null) => void;
}) {
  return (
    <BottomSheetModal ref={sheetRef} snapPoints={["60%"]} scrollable>
      <View className="px-4 pb-2 pt-2">
        <Text
          className="mb-3 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          {t("workout.fields.blockOptional")}
        </Text>

        <View className="gap-2">
          <BlockRow
            label={t("workout.fields.blockNone")}
            selected={selectedId === null}
            onPress={() => onPick(null)}
          />
          {blocks.map((block) => (
            <BlockRow
              key={block._id}
              color={BLOCK_TYPE_COLORS[block.type]}
              label={blockLabel(t, block)}
              sub={formatBlockRange(locale, block.startDate, block.endDate)}
              selected={selectedId === block._id}
              onPress={() => onPick(block._id)}
            />
          ))}
        </View>
      </View>
    </BottomSheetModal>
  );
}

function BlockRow({
  color,
  label,
  sub,
  selected,
  onPress,
}: {
  color?: string;
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
      }}
    >
      <BlockDot color={color ?? LIGHT_THEME.wMute} />
      <View className="flex-1 gap-0.5">
        <Text
          className="font-coach-bold text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {sub && (
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
            numberOfLines={1}
          >
            {sub}
          </Text>
        )}
      </View>
      {selected && (
        <Ionicons name="checkmark" size={18} color={LIGHT_THEME.wText} />
      )}
    </Pressable>
  );
}
