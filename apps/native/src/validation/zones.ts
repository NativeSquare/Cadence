import { parsePaceInput } from "@/lib/format-pace";
import type { TFunction } from "i18next";
import { z } from "zod";

export type ZoneKind = "hr" | "pace";

// Sentinel cap values for Z5's upper bound (mirrors @nativesquare/agoge).
export const ZONE_CAP: Record<ZoneKind, number> = {
  hr: 255,
  pace: 1609.34,
};

function makeNonNegativeIntegerString(t: TFunction) {
  return z
    .string()
    .trim()
    .refine((s) => /^\d+$/.test(s), {
      message: t("account.zones.validation.wholeNumber"),
    })
    .transform((s) => Number.parseInt(s, 10));
}

function makePaceMpsString(t: TFunction) {
  return z
    .string()
    .trim()
    .transform((s, ctx) => {
      const p = parsePaceInput(s);
      if (p === null || !Number.isFinite(p) || p <= 0) {
        ctx.addIssue({
          code: "custom",
          message: t("account.zones.validation.paceFormat"),
        });
        return z.NEVER;
      }
      return p;
    });
}

export function makeHrThresholdField(t: TFunction) {
  return makeNonNegativeIntegerString(t).refine(
    (n) => n >= 61 && n <= 250,
    { message: t("account.zones.validation.hrThresholdRange") },
  );
}

export function makePaceThresholdField(t: TFunction) {
  return makePaceMpsString(t);
}

export function getZoneOrderingMessage(t: TFunction, kind: ZoneKind): string {
  return kind === "hr"
    ? t("account.zones.validation.hrOrdering")
    : t("account.zones.validation.paceOrdering");
}

export function getZoneFormatMessage(t: TFunction, kind: ZoneKind): string {
  return kind === "hr"
    ? t("account.zones.validation.hrFormat")
    : t("account.zones.validation.paceFormat");
}

function getZoneCapMessage(t: TFunction, kind: ZoneKind): string {
  return kind === "hr"
    ? t("account.zones.validation.hrCap", { cap: ZONE_CAP.hr })
    : t("account.zones.validation.paceCap");
}

export function makeZonesFormSchema(t: TFunction, kind: ZoneKind) {
  const field =
    kind === "hr"
      ? makeNonNegativeIntegerString(t)
      : makePaceMpsString(t);
  const orderingMessage = getZoneOrderingMessage(t, kind);
  const capMessage = getZoneCapMessage(t, kind);
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
