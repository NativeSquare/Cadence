/**
 * Menstrual-cycle analytics — wraps `soma.listMenstruation` for the cycle
 * phase card. Most fields are provider-dependent and optional; the UI
 * gracefully handles missing values.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { soma } from "../soma/index";

type SoughtMenstruation = {
  metadata: { start_time: string; end_time: string };
  menstruation_data?: {
    day_in_cycle?: number;
    current_phase?: string;
    period_start_date?: string;
    cycle_length_days?: string;
    predicted_cycle_length_days?: number;
    period_length_days?: number;
    days_until_next_phase?: number;
    menstruation_flow?: { timestamp?: string; flow?: number }[];
  };
};

export const list = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (
    ctx,
    { startDate, endDate },
  ): Promise<
    {
      startTime: string;
      endTime: string;
      dayInCycle?: number;
      currentPhase?: string;
      periodStartDate?: string;
      cycleLengthDays?: number;
      periodLengthDays?: number;
      daysUntilNextPhase?: number;
      flow: { date: string; flow: number }[];
    }[]
  > => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const raw = (await soma.listMenstruation(ctx, {
      userId,
      startTime: startDate,
      endTime: endDate,
      order: "asc",
    })) as SoughtMenstruation[];

    return raw.map((m) => {
      const d = m.menstruation_data ?? {};
      const cycleLenStr = d.cycle_length_days;
      const cycleLenNum =
        cycleLenStr !== undefined ? Number(cycleLenStr) : undefined;
      return {
        startTime: m.metadata.start_time,
        endTime: m.metadata.end_time,
        dayInCycle: d.day_in_cycle,
        currentPhase: d.current_phase,
        periodStartDate: d.period_start_date,
        cycleLengthDays:
          cycleLenNum !== undefined && Number.isFinite(cycleLenNum)
            ? cycleLenNum
            : d.predicted_cycle_length_days,
        periodLengthDays: d.period_length_days,
        daysUntilNextPhase: d.days_until_next_phase,
        flow: (d.menstruation_flow ?? []).flatMap((f) =>
          f.timestamp && typeof f.flow === "number"
            ? [{ date: f.timestamp.slice(0, 10), flow: f.flow }]
            : [],
        ),
      };
    });
  },
});
