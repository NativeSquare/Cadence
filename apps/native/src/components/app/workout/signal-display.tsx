/**
 * Shared rendering of the qualitative signals an LLM derives from a post-session
 * voice debrief — used in two places that must stay visually consistent: the
 * in-the-moment `CoachResponse` (Mark Done sheet) and the persistent readout on
 * the workout detail page (`WorkoutAudioNote`).
 *
 * Two pieces:
 *  - `ConcernTierPill` — the entry's single Concern-tier verdict
 *    (`none`/`watch`/`act` → green/amber/red), the colored "intensity" cue.
 *  - `SignalChips` — the neutral "You mentioned: right calf · RPE 7" chips. The
 *    chips stay colorless on purpose: the *tier* carries the one color, so the
 *    chips read as detail, not a wall of alarm.
 */
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export type Concern = "none" | "watch" | "act";

/** The structured signals shape (mirrors the backend `derivedValidator`). */
export type DerivedSignals = {
  rpe?: number;
  painLocations?: { area: string; severity?: number }[];
  sleepQuality?: "poor" | "ok" | "good";
  lifeStress?: "low" | "med" | "high";
  motivation?: "low" | "med" | "high";
  effortFeel?: "easy" | "right" | "hard";
  mood?: string;
  rawNotes?: string;
  concern?: Concern;
};

/** Title-case a snake_case body-part key as a last-resort display fallback. */
function prettifyKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Build the "You mentioned" chip labels from the extracted signals. */
export function buildChips(t: TFunction, derived: DerivedSignals): string[] {
  const chips: string[] = [];

  for (const pain of derived.painLocations ?? []) {
    const area = t(`workout.bodyPart.${pain.area}`, {
      defaultValue: prettifyKey(pain.area),
    });
    chips.push(
      pain.severity != null
        ? t("workout.detail.signals.painWithSeverity", {
            area,
            severity: pain.severity,
          })
        : area,
    );
  }
  if (derived.rpe != null)
    chips.push(t("workout.detail.signals.rpe", { value: derived.rpe }));
  if (derived.effortFeel)
    chips.push(t(`workout.detail.signals.effort.${derived.effortFeel}`));
  if (derived.sleepQuality)
    chips.push(t(`workout.detail.signals.sleep.${derived.sleepQuality}`));
  if (derived.lifeStress)
    chips.push(t(`workout.detail.signals.stress.${derived.lifeStress}`));
  if (derived.motivation)
    chips.push(t(`workout.detail.signals.motivation.${derived.motivation}`));
  if (derived.mood) chips.push(derived.mood);

  return chips;
}

// Solid tint + 12%-opacity wash per tier. `act` reads as a calm red dot, not a
// full alarm panel — the wash is the soft variant, never the saturated color.
const TIER_COLORS: Record<Concern, { fg: string; wash: string }> = {
  none: { fg: COLORS.grn, wash: COLORS.grnDim },
  watch: { fg: COLORS.ylw, wash: COLORS.ylwDim },
  act: { fg: COLORS.red, wash: COLORS.redDim },
};

/** Look up the tier palette — exported so the reply card can match the wash. */
export function tierColors(concern: Concern): { fg: string; wash: string } {
  return TIER_COLORS[concern];
}

/**
 * The Concern-tier verdict pill: a filled dot + short label, both in the tier
 * color, on a soft wash. Color *and* text, so it never relies on color alone.
 */
export function ConcernTierPill({ concern }: { concern: Concern }) {
  const { t } = useTranslation();
  const c = TIER_COLORS[concern];
  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: c.wash }}
    >
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.fg }}
      />
      <Text className="font-coach-semibold text-[12px]" style={{ color: c.fg }}>
        {t(`workout.markDone.tier.${concern}`)}
      </Text>
    </View>
  );
}

/**
 * The neutral "You mentioned" chip row. Renders nothing when there are no
 * chips. `header` toggles the small "You mentioned" eyebrow above the chips.
 */
export function SignalChips({
  chips,
  header = true,
}: {
  chips: string[];
  header?: boolean;
}) {
  const { t } = useTranslation();
  if (chips.length === 0) return null;

  return (
    <View className="gap-2">
      {header && (
        <Text
          className="font-coach-semibold text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {t("workout.detail.signals.mentioned")}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        {chips.map((label, i) => (
          <View
            key={`${label}-${i}`}
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: LIGHT_THEME.w3 }}
          >
            <Text
              className="font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
