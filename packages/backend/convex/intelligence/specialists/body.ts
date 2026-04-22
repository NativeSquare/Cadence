import { anthropic } from "@ai-sdk/anthropic";
import type {
  SomaActivity,
  SomaDaily,
} from "@nativesquare/soma/validators";
import { generateObject } from "ai";
import { z } from "zod";
import { components } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import { BODY_SPECIALIST_PROMPT } from "../prompts";
import type { SpecialistPerspective } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BIOMETRICS_WINDOW_DAYS = 7;
const ACTIVITIES_WINDOW_DAYS = 14;

type BiometricsSignal = {
  date: string;
  hrvMs?: number;
  restingHr?: number;
  sleepScore?: number;
};

type ActivitySignal = {
  startTime?: string;
  endTime?: string;
  terraType?: number;
  distanceMeters?: number;
  avgHr?: number;
  maxHr?: number;
  tss?: number;
};

type BodySignals = {
  biometrics: BiometricsSignal[];
  activities: ActivitySignal[];
};

export async function consultBody(
  ctx: ActionCtx,
  args: { subQuery: string; userId: Id<"users"> },
): Promise<SpecialistPerspective> {
  const signals = await loadBodySignals(ctx, args.userId);

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: z.object({
      finding: z.string(),
      reasoning: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
    }),
    system: BODY_SPECIALIST_PROMPT,
    prompt: buildBodyPrompt(args.subQuery, signals),
  });

  return { specialist: "body", ...object };
}

async function loadBodySignals(
  ctx: ActionCtx,
  userId: Id<"users">,
): Promise<BodySignals> {
  const now = Date.now();
  const biometricsFrom = new Date(
    now - BIOMETRICS_WINDOW_DAYS * MS_PER_DAY,
  ).toISOString();
  const activitiesFrom = new Date(
    now - ACTIVITIES_WINDOW_DAYS * MS_PER_DAY,
  ).toISOString();

  const [dailies, activities] = await Promise.all([
    ctx.runQuery(components.soma.public.listDaily, {
      userId,
      startTime: biometricsFrom,
      order: "desc",
    }) as Promise<SomaDaily[]>,
    ctx.runQuery(components.soma.public.listActivities, {
      userId,
      startTime: activitiesFrom,
      order: "desc",
    }) as Promise<SomaActivity[]>,
  ]);

  return {
    biometrics: dailies.map(projectBiometrics),
    activities: activities.map(projectActivity),
  };
}

function projectBiometrics(daily: SomaDaily): BiometricsSignal {
  return {
    date: daily.metadata.start_time.split("T")[0],
    hrvMs: daily.heart_rate_data?.summary?.avg_hrv_rmssd,
    restingHr: daily.heart_rate_data?.summary?.resting_hr_bpm,
    sleepScore: daily.scores?.sleep,
  };
}

function projectActivity(activity: SomaActivity): ActivitySignal {
  return {
    startTime: activity.metadata.start_time,
    endTime: activity.metadata.end_time,
    terraType: activity.metadata.type,
    distanceMeters: activity.distance_data?.summary?.distance_meters,
    avgHr: activity.heart_rate_data?.summary?.avg_hr_bpm,
    maxHr: activity.heart_rate_data?.summary?.max_hr_bpm,
    tss: activity.TSS_data?.TSS_samples?.[0]?.actual,
  };
}

function buildBodyPrompt(subQuery: string, signals: BodySignals): string {
  const hasSignals =
    signals.biometrics.length > 0 || signals.activities.length > 0;

  const signalsBlock = hasSignals
    ? JSON.stringify(signals, null, 2)
    : "(empty — no Soma data in the window)";

  return `Router sub-query: ${subQuery}

Soma signals (last ${BIOMETRICS_WINDOW_DAYS}d biometrics, last ${ACTIVITIES_WINDOW_DAYS}d activities):
${signalsBlock}

Respond with a structured finding, reasoning, and confidence.`;
}
