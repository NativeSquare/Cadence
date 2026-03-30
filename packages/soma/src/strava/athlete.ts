// ─── Athlete Transformer ─────────────────────────────────────────────────────
// Transforms a Strava DetailedAthlete into the Soma Athlete schema shape.

import type { DetailedAthlete } from "./types.js";

/**
 * The output shape of {@link transformAthlete}.
 */
export type AthleteData = ReturnType<typeof transformAthlete>;

/**
 * Transform a Strava athlete profile into a Soma Athlete document shape.
 *
 * Strava provides a relatively rich profile compared to HealthKit, including
 * name, location, sex, and the date the athlete joined Strava.
 *
 * @param athlete - The Strava DetailedAthlete from `GET /athlete`
 * @returns Soma Athlete fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformAthlete(stravaAthlete);
 * await soma.ingestAthlete(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformAthlete(athlete: DetailedAthlete) {
  const sexMap: Record<string, string> = {
    M: "male",
    F: "female",
  };

  return {
    first_name: athlete.firstname ?? undefined,
    last_name: athlete.lastname ?? undefined,
    city: athlete.city ?? undefined,
    state: athlete.state ?? undefined,
    country: athlete.country ?? undefined,
    sex: athlete.sex ? sexMap[athlete.sex] : undefined,
    joined_provider: athlete.created_at ?? undefined,
    devices: athlete.bikes && athlete.shoes
      ? [
        ...athlete.bikes.map((b) => ({ name: b.name, id: b.id })),
        ...athlete.shoes.map((s) => ({ name: s.name, id: s.id })),
      ]
      : undefined,
  };
}
