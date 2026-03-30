// ─── Nutrition Transformer ────────────────────────────────────────────────────
// Transforms Apple HealthKit dietary quantity samples into the Soma Nutrition schema.

import type { HKQuantitySample } from "./types.js";
import { filterByType, sumValues, sampleTimeRange } from "./utils.js";

/**
 * The output shape of {@link transformNutrition}.
 */
export type NutritionData = ReturnType<typeof transformNutrition>;

/**
 * Transform an array of HealthKit dietary quantity samples into a
 * Soma Nutrition document shape.
 *
 * Accepts samples with dietary type identifiers (protein, carbs, fat, water,
 * vitamins, minerals, etc.) and aggregates them into Soma's macros/micros
 * summary format.
 *
 * @param samples - Array of HKQuantitySample with dietary type identifiers
 * @param timeRange - Optional explicit time range; auto-detected from samples if omitted
 * @returns Soma Nutrition fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformNutrition(hkDietarySamples);
 * await soma.ingestNutrition(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformNutrition(
  samples: HKQuantitySample[],
  timeRange?: { start_time: string; end_time: string },
) {
  const range = timeRange ?? sampleTimeRange(samples);

  const sum = (type: string) => {
    const filtered = filterByType(samples, type);
    return filtered.length > 0 ? sumValues(filtered) : undefined;
  };

  // ── Macros ─────────────────────────────────────────────────────────────
  const calories = sum("HKQuantityTypeIdentifierDietaryEnergyConsumed");
  const protein = sum("HKQuantityTypeIdentifierDietaryProtein");
  const carbs = sum("HKQuantityTypeIdentifierDietaryCarbohydrates");
  const fat = sum("HKQuantityTypeIdentifierDietaryFatTotal");
  const saturatedFat = sum("HKQuantityTypeIdentifierDietaryFatSaturated");
  const fiber = sum("HKQuantityTypeIdentifierDietaryFiber");
  const sugar = sum("HKQuantityTypeIdentifierDietarySugar");
  const cholesterol = sum("HKQuantityTypeIdentifierDietaryCholesterol");
  const sodium = sum("HKQuantityTypeIdentifierDietarySodium");

  // ── Micros ─────────────────────────────────────────────────────────────
  const calcium = sum("HKQuantityTypeIdentifierDietaryCalcium");
  const iron = sum("HKQuantityTypeIdentifierDietaryIron");
  const potassium = sum("HKQuantityTypeIdentifierDietaryPotassium");
  const vitaminA = sum("HKQuantityTypeIdentifierDietaryVitaminA");
  const vitaminB6 = sum("HKQuantityTypeIdentifierDietaryVitaminB6");
  const vitaminB12 = sum("HKQuantityTypeIdentifierDietaryVitaminB12");
  const vitaminC = sum("HKQuantityTypeIdentifierDietaryVitaminC");
  const vitaminD = sum("HKQuantityTypeIdentifierDietaryVitaminD");
  const vitaminE = sum("HKQuantityTypeIdentifierDietaryVitaminE");
  const vitaminK = sum("HKQuantityTypeIdentifierDietaryVitaminK");
  const zinc = sum("HKQuantityTypeIdentifierDietaryZinc");
  const magnesium = sum("HKQuantityTypeIdentifierDietaryMagnesium");
  const manganese = sum("HKQuantityTypeIdentifierDietaryManganese");
  const copper = sum("HKQuantityTypeIdentifierDietaryCopper");
  const selenium = sum("HKQuantityTypeIdentifierDietarySelenium");
  const chromium = sum("HKQuantityTypeIdentifierDietaryChromium");
  const folate = sum("HKQuantityTypeIdentifierDietaryFolate");
  const biotin = sum("HKQuantityTypeIdentifierDietaryBiotin");
  const niacin = sum("HKQuantityTypeIdentifierDietaryNiacin");
  const phosphorus = sum("HKQuantityTypeIdentifierDietaryPhosphorus");
  const riboflavin = sum("HKQuantityTypeIdentifierDietaryRiboflavin");
  const thiamin = sum("HKQuantityTypeIdentifierDietaryThiamin");
  const caffeine = sum("HKQuantityTypeIdentifierDietaryCaffeine");
  const iodine = sum("HKQuantityTypeIdentifierDietaryIodine");
  const chloride = sum("HKQuantityTypeIdentifierDietaryChloride");
  const pantothenicAcid = sum(
    "HKQuantityTypeIdentifierDietaryPanthothenicAcid",
  );

  // ── Fats breakdown ─────────────────────────────────────────────────────
  const monoFat = sum("HKQuantityTypeIdentifierDietaryFatMonounsaturated");
  const polyFat = sum("HKQuantityTypeIdentifierDietaryFatPolyunsaturated");

  // ── Water ──────────────────────────────────────────────────────────────
  const waterSamples = filterByType(
    samples,
    "HKQuantityTypeIdentifierDietaryWater",
  );
  const waterMl =
    waterSamples.length > 0 ? sumValues(waterSamples) * 1000 : undefined; // L → mL

  const hasMacros =
    calories != null ||
    protein != null ||
    carbs != null ||
    fat != null;

  const hasMicros =
    calcium != null ||
    iron != null ||
    vitaminC != null ||
    zinc != null ||
    magnesium != null;

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
    },

    summary: {
      macros: hasMacros
        ? {
            calories,
            protein_g: protein,
            carbohydrates_g: carbs,
            fat_g: fat,
            saturated_fat_g: saturatedFat,
            fiber_g: fiber,
            sugar_g: sugar,
            cholesterol_mg: cholesterol,
            sodium_mg: sodium,
          }
        : undefined,
      micros: hasMicros
        ? {
            calcium_mg: calcium,
            iron_mg: iron,
            potassium_mg: potassium,
            vitamin_A_mg: vitaminA,
            vitamin_B6_mg: vitaminB6,
            vitamin_B12_mg: vitaminB12,
            vitamin_C_mg: vitaminC,
            vitamin_D_mg: vitaminD,
            vitamin_E_mg: vitaminE,
            vitamin_K_mg: vitaminK,
            zinc_mg: zinc,
            magnesium_mg: magnesium,
            manganese_mg: manganese,
            copper_mg: copper,
            selenium_mg: selenium,
            chromium_mg: chromium,
            folate_mg: folate,
            biotin_mg: biotin,
            niacin_mg: niacin,
            phosphorus_mg: phosphorus,
            riboflavin_mg: riboflavin,
            thiamin_mg: thiamin,
            caffeine_mg: caffeine,
            iodine_mg: iodine,
            chloride_mg: chloride,
            pantothenic_acid_mg: pantothenicAcid,
            monounsaturated_fat_g: monoFat,
            polyunsaturated_fat_g: polyFat,
          }
        : undefined,
      water_ml: waterMl,
    },
  };
}
