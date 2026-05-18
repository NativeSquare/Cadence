/**
 * Sleep analytics — thin wrapper over `soma.listSleep` that returns the
 * per-night summary the Analytics screen renders. Filters out naps.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { soma } from "../soma/index";

type SoughtSleep = {
  metadata: { start_time: string; end_time: string; is_nap?: boolean };
  sleep_durations_data?: {
    asleep?: { duration_asleep_state_seconds?: number };
  };
  data_enrichment?: { sleep_score?: number };
  scores?: { sleep?: number };
};

export const list = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (
    ctx,
    { startDate, endDate },
  ): Promise<
    {
      night: string;
      startTime: string;
      durationHours: number;
      sleepScore?: number;
    }[]
  > => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const raw = (await soma.listSleep(ctx, {
      userId,
      startTime: startDate,
      endTime: endDate,
      order: "asc",
    })) as SoughtSleep[];

    return raw.flatMap((s) => {
      if (s.metadata.is_nap) return [];
      const sec = s.sleep_durations_data?.asleep?.duration_asleep_state_seconds;
      if (typeof sec !== "number" || sec <= 0) return [];
      return [
        {
          night: s.metadata.start_time.slice(0, 10),
          startTime: s.metadata.start_time,
          durationHours: sec / 3600,
          sleepScore: s.data_enrichment?.sleep_score ?? s.scores?.sleep,
        },
      ];
    });
  },
});
