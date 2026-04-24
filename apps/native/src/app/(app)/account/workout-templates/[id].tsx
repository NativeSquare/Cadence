import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
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

// Minimal local types for the step-tree display. Backend validates via Zod,
// these only need to cover what we render.
type Intensity =
  | "warmup"
  | "active"
  | "interval"
  | "recovery"
  | "cooldown"
  | "rest";

type Duration =
  | { type: "time"; seconds: number }
  | { type: "distance"; meters: number }
  | { type: "hrBelow"; bpm: number }
  | { type: "hrAbove"; bpm: number }
  | { type: "open" };

type Target =
  | { type: "pace"; minMps: number; maxMps: number }
  | { type: "hr"; minBpm: number; maxBpm: number }
  | { type: "rpe"; min: number; max: number }
  | { type: "zone"; kind: "hr" | "pace"; zone: number }
  | { type: "open" };

type Step = {
  kind: "step";
  label?: string;
  intensity: Intensity;
  duration: Duration;
  target: Target;
  notes?: string;
};

type Repeat = {
  kind: "repeat";
  count: number;
  children: StepNode[];
};

type StepNode = Step | Repeat;

const INTENSITY_LABELS: Record<Intensity, string> = {
  warmup: "Warmup",
  active: "Active",
  interval: "Interval",
  recovery: "Recovery",
  cooldown: "Cooldown",
  rest: "Rest",
};

const INTENSITY_COLORS: Record<Intensity, string> = {
  warmup: COLORS.blu,
  active: COLORS.lime,
  interval: COLORS.ora,
  recovery: COLORS.grn,
  cooldown: COLORS.blu,
  rest: LIGHT_THEME.wSub,
};

function formatDuration(d: Duration): string {
  switch (d.type) {
    case "time": {
      const m = Math.floor(d.seconds / 60);
      const s = d.seconds - m * 60;
      if (m > 0 && s === 0) return `${m} min`;
      if (m === 0) return `${s}s`;
      return `${m}:${s.toString().padStart(2, "0")}`;
    }
    case "distance":
      return d.meters >= 1000 ? `${(d.meters / 1000).toFixed(1)} km` : `${d.meters} m`;
    case "hrBelow":
      return `until HR < ${d.bpm}`;
    case "hrAbove":
      return `until HR > ${d.bpm}`;
    case "open":
      return "open";
  }
}

function paceMpsToMinPerKm(mps: number): string {
  if (!Number.isFinite(mps) || mps <= 0) return "—";
  const secPerKm = 1000 / mps;
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm - minutes * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatTarget(t: Target): string | null {
  switch (t.type) {
    case "pace":
      return `${paceMpsToMinPerKm(t.maxMps)}–${paceMpsToMinPerKm(t.minMps)} /km`;
    case "hr":
      return `${t.minBpm}–${t.maxBpm} bpm`;
    case "rpe":
      return `RPE ${t.min}–${t.max}`;
    case "zone":
      return `Zone ${t.zone} ${t.kind === "hr" ? "HR" : "Pace"}`;
    case "open":
      return null;
  }
}

function isStepNodeArray(x: unknown): x is StepNode[] {
  return Array.isArray(x);
}

type FormState = {
  name: string;
  description: string;
};

function isFormEqual(a: FormState, b: FormState): boolean {
  return a.name === b.name && a.description === b.description;
}

export default function TemplateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const template = useQuery(api.plan.workoutTemplates.getMyTemplate, {
    templateId: id,
  });
  const updateMetadata = useMutation(
    api.plan.workoutTemplates.updateMyTemplateMetadata,
  );
  const deleteTemplate = useMutation(
    api.plan.workoutTemplates.deleteMyTemplate,
  );

  const [initial, setInitial] = React.useState<FormState>({
    name: "",
    description: "",
  });
  const [form, setForm] = React.useState<FormState>(initial);
  const [hydrated, setHydrated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);

  React.useEffect(() => {
    if (hydrated || template === undefined) return;
    if (template === null) {
      setError("Template not found");
      return;
    }
    const next: FormState = {
      name: template.name,
      description: template.description ?? "",
    };
    setInitial(next);
    setForm(next);
    setHydrated(true);
  }, [template, hydrated]);

  const hasChanges = hydrated && !isFormEqual(form, initial);
  const canSave = hasChanges && form.name.trim().length > 0;
  const isGlobal = template != null && template.athleteId == null;

  const handleSave = async () => {
    setError(null);
    Keyboard.dismiss();
    if (!canSave) return;

    setIsLoading(true);
    try {
      await updateMetadata({
        templateId: id,
        name: form.name.trim(),
        description: form.description.trim(),
      });
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTemplate({ templateId: id });
      deleteSheetRef.current?.dismiss();
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
      setIsDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="mt-safe flex-1"
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
          Template
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <Field label="Name">
            <TextInput
              className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: LIGHT_THEME.wBrd,
                color: LIGHT_THEME.wText,
              }}
              placeholder="Template name"
              placeholderTextColor={LIGHT_THEME.wMute}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              editable={!isGlobal}
              autoCapitalize="words"
              selectionColor={COLORS.lime}
              cursorColor={COLORS.lime}
            />
          </Field>

          <Field label="Description">
            <TextInput
              className="rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: LIGHT_THEME.wBrd,
                color: LIGHT_THEME.wText,
                minHeight: 88,
                textAlignVertical: "top",
              }}
              placeholder="What this workout is for"
              placeholderTextColor={LIGHT_THEME.wMute}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              editable={!isGlobal}
              multiline
              selectionColor={COLORS.lime}
              cursorColor={COLORS.lime}
            />
          </Field>

          <View className="gap-2">
            <Text
              className="px-1 font-coach-semibold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Structure
            </Text>
            <View
              className="overflow-hidden rounded-[18px]"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              {template == null ? null : isStepNodeArray(
                template.content?.structure,
              ) && template.content.structure.length > 0 ? (
                <StepTreeView nodes={template.content.structure} />
              ) : (
                <Text
                  className="px-4 py-6 text-center font-coach text-[13px]"
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  Empty structure
                </Text>
              )}
            </View>
            <Text
              className="px-1 font-coach text-[11px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Structure is authored by your Coach. Read-only here.
            </Text>
          </View>

          {!isGlobal && (
            <Pressable
              className="items-center py-2 active:opacity-70"
              onPress={() => deleteSheetRef.current?.present()}
            >
              <Text
                className="font-coach text-[13px]"
                style={{ color: COLORS.red }}
              >
                Delete template
              </Text>
            </Pressable>
          )}

          {isGlobal && (
            <Text
              className="text-center font-coach text-[11px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Shared template — read-only.
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="w-full max-w-md gap-2 self-center px-4 pb-4 mb-safe">
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
          disabled={isLoading || !canSave || isGlobal}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isLoading || !canSave || isGlobal
                ? LIGHT_THEME.w3
                : LIGHT_THEME.wText,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color:
                  isLoading || !canSave || isGlobal
                    ? LIGHT_THEME.wMute
                    : "#FFFFFF",
              }}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <ConfirmationSheet
        sheetRef={deleteSheetRef}
        icon="trash-outline"
        title="Delete template"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function StepTreeView({
  nodes,
  depth = 0,
}: {
  nodes: StepNode[];
  depth?: number;
}) {
  return (
    <View>
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1;
        if (node.kind === "step") {
          return <StepRow key={i} step={node} depth={depth} isLast={isLast} />;
        }
        return (
          <View key={i}>
            <RepeatHeader count={node.count} depth={depth} />
            <StepTreeView nodes={node.children} depth={depth + 1} />
          </View>
        );
      })}
    </View>
  );
}

function RepeatHeader({ count, depth }: { count: number; depth: number }) {
  return (
    <View
      className="flex-row items-center gap-2 px-4 py-2"
      style={{
        backgroundColor: LIGHT_THEME.w2,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_THEME.wBrd,
        paddingLeft: 16 + depth * 16,
      }}
    >
      <Ionicons name="repeat" size={14} color={LIGHT_THEME.wSub} />
      <Text
        className="font-coach-semibold text-[12px]"
        style={{ color: LIGHT_THEME.wSub }}
      >
        Repeat × {count}
      </Text>
    </View>
  );
}

function StepRow({
  step,
  depth,
  isLast,
}: {
  step: Step;
  depth: number;
  isLast: boolean;
}) {
  const target = formatTarget(step.target);
  return (
    <View
      className="flex-row items-center gap-3 px-4 py-3"
      style={{
        paddingLeft: 16 + depth * 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: LIGHT_THEME.wBrd,
      }}
    >
      <View
        className="size-2 rounded-full"
        style={{ backgroundColor: INTENSITY_COLORS[step.intensity] }}
      />
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="font-coach-medium text-[13px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {step.label ?? INTENSITY_LABELS[step.intensity]}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-coach text-[11px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {formatDuration(step.duration)}
          {target ? ` · ${target}` : ""}
        </Text>
      </View>
    </View>
  );
}
