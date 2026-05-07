import {
  DateField,
  FormField,
  FormSection,
  PillSelect,
} from "@/components/app/form";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { blockTypeLabel } from "@/components/app/workout/workout-helpers";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { BlockType } from "@nativesquare/agoge/schema";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { BLOCK_TYPES, BLOCK_TYPE_COLORS } from "./constants";

export type BlockFormInitial = {
  name: string;
  type: BlockType;
  startDate: string;
  endDate: string;
  focus?: string;
  order: number;
};

export type BlockFormSubmit = {
  name: string;
  type: BlockType;
  startDate: string;
  endDate: string;
  focus?: string;
  order: number;
};

type FormState = {
  name: string;
  type: BlockType;
  startDate: string;
  endDate: string;
  focus: string;
  orderText: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  type: "base",
  startDate: "",
  endDate: "",
  focus: "",
  orderText: "1",
};

function isoToYmd(iso: string): string {
  return iso.slice(0, 10);
}

function ymdToStartOfDayIso(ymd: string): string {
  return `${ymd}T00:00:00.000Z`;
}

function ymdToEndOfDayIso(ymd: string): string {
  return `${ymd}T23:59:59.999Z`;
}

function initialToForm(initial: BlockFormInitial): FormState {
  return {
    name: initial.name,
    type: initial.type,
    startDate: isoToYmd(initial.startDate),
    endDate: isoToYmd(initial.endDate),
    focus: initial.focus ?? "",
    orderText: String(initial.order),
  };
}

export function BlockForm({
  title,
  initial,
  defaultOrder,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  title: string;
  initial?: BlockFormInitial;
  defaultOrder?: number;
  submitLabel: string;
  onSubmit: (values: BlockFormSubmit) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const blockTypeLabels: Record<BlockType, string> = React.useMemo(
    () =>
      BLOCK_TYPES.reduce(
        (acc, kind) => ({ ...acc, [kind]: blockTypeLabel(t, kind) }),
        {} as Record<BlockType, string>,
      ),
    [t],
  );
  const [form, setForm] = React.useState<FormState>(() => {
    if (initial) return initialToForm(initial);
    return defaultOrder != null
      ? { ...EMPTY_FORM, orderText: String(defaultOrder) }
      : EMPTY_FORM;
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);

  const startValid = form.startDate.length === 10;
  const endValid = form.endDate.length === 10;
  const datesOrdered =
    !startValid || !endValid || form.endDate >= form.startDate;
  const orderNum = Number.parseInt(form.orderText, 10);
  const orderValid = Number.isFinite(orderNum) && orderNum > 0;

  const canSave =
    form.name.trim().length > 0 &&
    startValid &&
    endValid &&
    datesOrdered &&
    orderValid;

  const handleSave = async () => {
    setError(null);
    Keyboard.dismiss();
    if (!canSave) {
      if (!datesOrdered) {
        setError(t("account.blocks.errorEndBeforeStart"));
      } else {
        setError(t("account.blocks.errorRequired"));
      }
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        startDate: ymdToStartOfDayIso(form.startDate),
        endDate: ymdToEndOfDayIso(form.endDate),
        focus: form.focus.trim() || undefined,
        order: orderNum,
      });
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      deleteSheetRef.current?.dismiss();
      router.dismissAll();
      router.replace("/account/training-plan");
    } catch (err) {
      setError(getConvexErrorMessage(err));
      setIsDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-4"
        style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
      >
        <Pressable
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="chevron-back" size={20} color={LIGHT_THEME.wText} />
        </Pressable>
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          {title}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-8 self-center">
          <FormSection title={t("account.blocks.section")}>
            <FormField label={t("account.blocks.name")}>
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder={t("account.blocks.namePlaceholder")}
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                autoCapitalize="words"
                returnKeyType="next"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>

            <FormField label={t("account.blocks.type")}>
              <PillSelect
                options={BLOCK_TYPES}
                labels={blockTypeLabels}
                value={form.type}
                onChange={(v) => setForm((f) => ({ ...f, type: v }))}
                colorByValue={BLOCK_TYPE_COLORS}
              />
            </FormField>

            <FormField label={t("account.blocks.focusOptional")}>
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder={t("account.blocks.focusPlaceholder")}
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.focus}
                onChangeText={(v) => setForm((f) => ({ ...f, focus: v }))}
                autoCapitalize="sentences"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>
          </FormSection>

          <FormSection title={t("account.blocks.datesSection")}>
            <DateField
              label={t("account.blocks.startDate")}
              value={form.startDate || undefined}
              onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
            />
            <DateField
              label={t("account.blocks.endDate")}
              value={form.endDate || undefined}
              onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
              minDate={form.startDate || undefined}
            />
          </FormSection>

          <FormSection title={t("account.blocks.orderSection")}>
            <FormField label={t("account.blocks.positionInPlan")}>
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="1"
                placeholderTextColor={LIGHT_THEME.wMute}
                keyboardType="number-pad"
                value={form.orderText}
                onChangeText={(v) =>
                  setForm((f) => ({
                    ...f,
                    orderText: v.replace(/[^0-9]/g, ""),
                  }))
                }
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </FormField>
          </FormSection>

          {onDelete && (
            <Pressable
              className="items-center py-2 active:opacity-70"
              onPress={() => deleteSheetRef.current?.present()}
            >
              <Text
                className="font-coach text-[13px]"
                style={{ color: COLORS.red }}
              >
                {t("account.blocks.deleteBlock")}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View className="mb-safe w-full max-w-md gap-2 self-center px-4 pb-4">
        {error && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}
        <Pressable
          onPress={handleSave}
          disabled={isLoading || !canSave}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isLoading || !canSave ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color: isLoading || !canSave ? LIGHT_THEME.wMute : "#FFFFFF",
              }}
            >
              {submitLabel}
            </Text>
          )}
        </Pressable>
      </View>

      {onDelete && (
        <ConfirmationSheet
          sheetRef={deleteSheetRef}
          icon="trash-outline"
          title={t("account.blocks.deleteBlock")}
          description={t("account.blocks.deleteDescription")}
          confirmLabel={t("workout.common.delete")}
          destructive
          loading={isDeleting}
          onConfirm={handleDelete}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};
