/**
 * Fitness page data.
 *
 * VDOT is the only stored fitness measurement (kind: "vdot" in the Agoge
 * metrics table). Training paces, equivalent race times, and any other
 * derivative reading are computed on read so the page always reflects the
 * latest test result without a separate sync step.
 */

import { components } from "../_generated/api";
import { query } from "../_generated/server";
import { loadAthlete } from "./helpers";
import { type Paces, predictRaceTime, trainingPaces } from "./periodization";

const STANDARD_RACE_METERS = {
  "5k": 5000,
  "10k": 10_000,
  half: 21_097.5,
  marathon: 42_195,
} as const;

export type RacePredictions = {
  "5k": number;
  "10k": number;
  half: number;
  marathon: number;
};

function predictStandardRaceTimes(vdot: number): RacePredictions {
  return {
    "5k": predictRaceTime(vdot, STANDARD_RACE_METERS["5k"]),
    "10k": predictRaceTime(vdot, STANDARD_RACE_METERS["10k"]),
    half: predictRaceTime(vdot, STANDARD_RACE_METERS.half),
    marathon: predictRaceTime(vdot, STANDARD_RACE_METERS.marathon),
  };
}

export type FitnessSnapshot = {
  vdot: number | null;
  lastMeasuredAt: number | null;
  history: { measuredAt: number; value: number }[];
  paces: Paces | null;
  predictions: RacePredictions | null;
};

/**
 * One-shot read for the Fitness page: latest VDOT + full history + derived
 * paces and race-time predictions. Returns null fields (not zeros) when the
 * athlete has no recorded VDOT yet — the UI uses that to render an empty
 * state instead of misleading "0:00" paces.
 */
export const getFitnessSnapshot = query({
  args: {},
  handler: async (ctx): Promise<FitnessSnapshot> => {
    const auth = await loadAthlete(ctx);
    if (!auth) {
      return {
        vdot: null,
        lastMeasuredAt: null,
        history: [],
        paces: null,
        predictions: null,
      };
    }

    const metrics = await ctx.runQuery(
      components.agoge.public.getMetricsByAthlete,
      { athleteId: auth.athlete._id, kind: "vdot" },
    );

    const sorted = [...metrics].sort(
      (a, b) => a._creationTime - b._creationTime,
    );
    const latest = sorted[sorted.length - 1];
    const history = sorted.map((m) => ({
      measuredAt: m._creationTime,
      value: m.value,
    }));

    if (!latest) {
      return {
        vdot: null,
        lastMeasuredAt: null,
        history,
        paces: null,
        predictions: null,
      };
    }

    return {
      vdot: latest.value,
      lastMeasuredAt: latest._creationTime,
      history,
      paces: trainingPaces(latest.value),
      predictions: predictStandardRaceTimes(latest.value),
    };
  },
});
