import { parsePaceInput } from "@/lib/format-pace";
import { z } from "zod";

const NonNegativeIntegerString = z
  .string()
  .trim()
  .refine((s) => /^\d+$/.test(s), { message: "Enter a whole number" })
  .transform((s) => Number.parseInt(s, 10));

const PaceMpsString = z
  .string()
  .trim()
  .transform((s, ctx) => {
    const p = parsePaceInput(s);
    if (p === null || !Number.isFinite(p) || p <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Use min:sec per km (e.g. 3:45)",
      });
      return z.NEVER;
    }
    return p;
  });

export const HrThresholdField = NonNegativeIntegerString.refine(
  (n) => n >= 61 && n <= 250,
  { message: "Enter a value between 61 and 250 bpm" },
);

export const PaceThresholdField = PaceMpsString;

const HrBoundaryField = NonNegativeIntegerString;
const PaceBoundaryField = PaceMpsString;

export type ZoneKind = "hr" | "pace";

// Sentinel cap values for Z5's upper bound (mirrors @nativesquare/agoge).
export const ZONE_CAP: Record<ZoneKind, number> = {
  hr: 255,
  pace: 1609.34,
};

export const ZONE_ORDERING_MESSAGES: Record<ZoneKind, string> = {
  hr: "Each zone must be higher than the one below",
  pace: "Each zone must be faster than the one below",
};

export const ZONE_FORMAT_MESSAGES: Record<ZoneKind, string> = {
  hr: "Enter whole numbers in bpm",
  pace: "Use min:sec per km (e.g. 3:45)",
};

export const ZONE_CAP_MESSAGES: Record<ZoneKind, string> = {
  hr: `Must be below ${ZONE_CAP.hr} bpm`,
  pace: "Pace is implausibly fast",
};

export function makeZonesFormSchema(kind: ZoneKind) {
  const field = kind === "hr" ? HrBoundaryField : PaceBoundaryField;
  const orderingMessage = ZONE_ORDERING_MESSAGES[kind];
  const capMessage = ZONE_CAP_MESSAGES[kind];
  const cap = ZONE_CAP[kind];
  return z
    .object({ b1: field, b2: field, b3: field, b4: field })
    .superRefine((data, ctx) => {
      const values = [data.b1, data.b2, data.b3, data.b4];
      const keys = ["b1", "b2", "b3", "b4"] as const;
      let prev = 0;
      for (let i = 0; i < values.length; i++) {
        if (values[i] <= prev) {
          ctx.addIssue({
            code: "custom",
            path: [keys[i]],
            message: orderingMessage,
          });
        } else if (values[i] >= cap) {
          ctx.addIssue({
            code: "custom",
            path: [keys[i]],
            message: capMessage,
          });
        }
        prev = values[i];
      }
    });
}
