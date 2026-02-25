import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";

type BodyFormData = {
  gender: "male" | "female" | undefined;
  weight: string;
  height: string;
  age: string;
  maxHr: string;
  restingHr: string;
};

function NumericField({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit?: string;
}) {
  return (
    <View className="gap-2">
      <Text
        className="font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <Input
          className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
            color: LIGHT_THEME.wText,
            textAlignVertical: "center",
          }}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={LIGHT_THEME.wMute}
          keyboardType="numeric"
          returnKeyType="done"
        />
        {unit && (
          <Text
            className="font-coach-medium text-[13px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function BodyScreen() {
  const router = useRouter();
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const updateRunner = useMutation(api.table.runners.updateRunner);

  const [formData, setFormData] = React.useState<BodyFormData>({
    gender: undefined,
    weight: "",
    height: "",
    age: "",
    maxHr: "",
    restingHr: "",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync form data when runner loads
  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (runner?.physical && !initialized.current) {
      initialized.current = true;
      setFormData({
        gender: runner.physical.gender ?? undefined,
        weight: runner.physical.weight?.toString() ?? "",
        height: runner.physical.height?.toString() ?? "",
        age: runner.physical.age?.toString() ?? "",
        maxHr: runner.physical.maxHr?.toString() ?? "",
        restingHr: runner.physical.restingHr?.toString() ?? "",
      });
    }
  }, [runner]);

  const parseNum = (v: string) => {
    const trimmed = v.trim();
    if (trimmed === "") return undefined;
    const n = Number(trimmed);
    return isNaN(n) ? undefined : n;
  };

  const hasChanges = React.useMemo(() => {
    const p = runner?.physical;
    if (!p && !formData.gender && !formData.weight && !formData.height && !formData.age && !formData.maxHr && !formData.restingHr) {
      return false;
    }
    return (
      formData.gender !== (p?.gender ?? undefined) ||
      formData.weight !== (p?.weight?.toString() ?? "") ||
      formData.height !== (p?.height?.toString() ?? "") ||
      formData.age !== (p?.age?.toString() ?? "") ||
      formData.maxHr !== (p?.maxHr?.toString() ?? "") ||
      formData.restingHr !== (p?.restingHr?.toString() ?? "")
    );
  }, [formData, runner]);

  const handleSave = async () => {
    setError(null);

    if (!runner?._id) {
      setError("Runner profile not found");
      return;
    }

    setIsLoading(true);
    try {
      await updateRunner({
        runnerId: runner._id,
        fields: {
          physical: {
            ...runner.physical,
            gender: formData.gender,
            weight: parseNum(formData.weight),
            height: parseNum(formData.height),
            age: parseNum(formData.age),
            maxHr: parseNum(formData.maxHr),
            restingHr: parseNum(formData.restingHr),
          },
        },
      });
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 mt-safe" style={{ backgroundColor: LIGHT_THEME.w2 }}>
      {/* Header */}
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
          Physical Profile
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {/* Gender Toggle */}
          <View className="gap-2">
            <Text
              className="font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Gender
            </Text>
            <View className="flex-row gap-3">
              {(["male", "female"] as const).map((g) => {
                const isActive = formData.gender === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        gender: prev.gender === g ? undefined : g,
                      }))
                    }
                    className="flex-1 items-center rounded-xl py-3 active:opacity-80"
                    style={{
                      backgroundColor: isActive
                        ? LIGHT_THEME.wText
                        : LIGHT_THEME.w1,
                      borderWidth: 1,
                      borderColor: isActive
                        ? LIGHT_THEME.wText
                        : LIGHT_THEME.wBrd,
                    }}
                  >
                    <Text
                      className="font-coach-semibold text-[14px]"
                      style={{
                        color: isActive ? "#FFFFFF" : LIGHT_THEME.wMute,
                      }}
                    >
                      {g === "male" ? "Male" : "Female"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Numeric fields */}
          <NumericField
            label="Weight"
            value={formData.weight}
            onChange={(v) => setFormData((p) => ({ ...p, weight: v }))}
            placeholder="70"
            unit="kg"
          />

          <NumericField
            label="Height"
            value={formData.height}
            onChange={(v) => setFormData((p) => ({ ...p, height: v }))}
            placeholder="175"
            unit="cm"
          />

          <NumericField
            label="Age"
            value={formData.age}
            onChange={(v) => setFormData((p) => ({ ...p, age: v }))}
            placeholder="30"
          />

          {/* HR Section */}
          <View
            className="mt-2 gap-4 rounded-2xl p-4"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderWidth: 1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Text
                className="font-coach-bold text-[15px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                Heart Rate Zones
              </Text>
              <Text
                className="font-coach text-[11px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                (optional)
              </Text>
            </View>

            <NumericField
              label="Max HR"
              value={formData.maxHr}
              onChange={(v) => setFormData((p) => ({ ...p, maxHr: v }))}
              placeholder="190"
              unit="bpm"
            />

            <NumericField
              label="Resting HR"
              value={formData.restingHr}
              onChange={(v) => setFormData((p) => ({ ...p, restingHr: v }))}
              placeholder="55"
              unit="bpm"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer with Save */}
      <View className="w-full max-w-md self-center gap-2 px-4 pb-4 mb-safe">
        {error && (
          <Text
            className="font-coach text-sm text-center"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}
        <Pressable
          onPress={handleSave}
          disabled={isLoading || !hasChanges}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isLoading || !hasChanges ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color: isLoading || !hasChanges ? LIGHT_THEME.wMute : "#FFFFFF",
              }}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
