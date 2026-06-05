/** Display helpers for the read-only 5K Playbook view. Pure, no deps. */

import type {
  BankEntry,
  Composition,
  RoleTemplate,
  StridesRule,
} from "@packages/backend/convex/agoge/plans/fiveKPlaybook";

/** Weekly frequencies shown as rows in each composition table (1 → "6+"). */
export const SLOT_ROWS = [2, 3, 4, 5, 6] as const;

/** Human label for a session role template (week-index rules described in words). */
export function roleTemplateLabel(t: RoleTemplate): string {
  switch (t.kind) {
    case "easy":
      return stridesLabel(t.strides);
    case "sv1_long":
      return "SV1 long run";
    case "sv2":
      return "SV2 threshold";
    case "vma_short":
      return "VMA courte (300m)";
    case "vma_long":
      return "VMA longue (800m)";
    case "mixed":
      return "Mixte (SV2 + VMA)";
    case "race_pace":
      return t.bank === "moderate" ? "Allure spé (modérée)" : "Allure spé";
    case "long_race_pace":
      return "Endurance longue (blocs AS42)";
    case "build_late_alt":
      return "VMA longue ↔ Mixte (by week)";
    case "build_early_alt":
      return "VMA longue ↔ courte (by week)";
    case "marathon_build_early_alt":
      return "SV2 ↔ VMA longue (by week)";
  }
}

/** Whether a role template is a "quality" (hard) session, for badge colouring. */
export function isQualityTemplate(t: RoleTemplate): boolean {
  return t.kind !== "easy";
}

function stridesLabel(rule: StridesRule): string {
  switch (rule) {
    case "always":
      return "Easy + strides";
    case "never":
      return "Easy";
    case "alt-weeks":
      return "Easy + strides (alt. weeks)";
  }
}

/**
 * Expand a phase composition at a weekly frequency into its template list —
 * mirrors the engine's `expandComposition`, but keeps the templates unresolved
 * (so the table shows the *rule*, e.g. "alt. weeks", not a single week's value).
 * Slots ≥ 6 fall to the overflow rule (lead + plain easies + trail).
 */
export function templatesForSlots(
  c: Composition,
  slots: number,
): RoleTemplate[] {
  return (
    c.bySlots[slots] ?? [
      ...c.overflow.lead,
      ...Array.from(
        { length: slots - c.overflow.padBase },
        (): RoleTemplate => ({ kind: "easy", strides: "never" }),
      ),
      ...c.overflow.trail,
    ]
  );
}

/** "30 min", "1 h 10" etc. from seconds. */
export function minutes(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h} h` : `${h} h ${rem}`;
}

/** "1 min 30" / "90 s" style recovery label from seconds. */
export function recovery(sec: number): string {
  if (sec % 60 === 0) return `${sec / 60} min`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} min ${String(s).padStart(2, "0")}`;
}

/** One-line label for a session-bank entry (reps × work · recovery). */
export function bankEntryLabel(e: BankEntry): string {
  switch (e.kind) {
    case "time":
      return `${e.reps} × ${minutes(e.workSec)} · récup ${recovery(e.recoverySec)}`;
    case "pacedTime":
      return `${e.reps} × ${minutes(e.workSec)} (allure) · récup ${recovery(e.recoverySec)}`;
    case "dist":
    case "paced":
      return `${e.reps} × ${e.repDistanceM} m · récup ${recovery(e.recoverySec)}`;
    case "mixte": {
      const first = `${e.first.reps} × ${minutes(e.first.workSec)} SV2`;
      const second = `${e.second.reps} × ${e.second.repDistanceM} m`;
      return `${first} + ${second} (transition ${recovery(e.bridgeSec)})`;
    }
  }
}
