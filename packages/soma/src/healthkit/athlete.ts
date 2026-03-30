// ─── Athlete Transformer ─────────────────────────────────────────────────────
// Transforms Apple HealthKit user characteristics into the Soma Athlete schema.
// NOTE: HealthKit exposes very limited profile data compared to other providers.

import type { HKCharacteristics } from "./types.js";

/**
 * The output shape of {@link transformAthlete}.
 */
export type AthleteData = ReturnType<typeof transformAthlete>;

/**
 * Transform HealthKit user characteristics into a Soma Athlete document shape.
 *
 * Apple HealthKit only exposes biological sex and date of birth as user
 * characteristics. Most other Athlete fields (name, email, etc.) are not
 * available from HealthKit and will remain undefined.
 *
 * @param characteristics - The user characteristics from HealthKit
 * @returns Soma Athlete fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformAthlete(hkCharacteristics);
 * await soma.ingestAthlete(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformAthlete(characteristics: HKCharacteristics) {
  const sexMap: Record<string, string> = {
    female: "female",
    male: "male",
    other: "other",
  };

  return {
    sex:
      characteristics.biologicalSex &&
      characteristics.biologicalSex !== "notSet"
        ? sexMap[characteristics.biologicalSex]
        : undefined,
    date_of_birth: characteristics.dateOfBirth,
  };
}
