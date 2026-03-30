// ─── Garmin Sleep Stage → Terra SleepLevel ────────────────────────────────────
// Maps Garmin sleep stage names to Terra's SleepLevel numeric enum.
//
// Garmin provides sleep levels as named map keys in sleepLevelsMap:
//   { deep: [...], light: [...], rem: [...], awake: [...] }
//
// Terra SleepLevel: 0=Unknown, 1=Awake, 2=Sleeping, 3=OutOfBed, 4=Light, 5=Deep, 6=REM

const sleepLevelMap: Record<string, number> = {
  deep: 5,   // Deep → Terra Deep
  light: 4,  // Light → Terra Light
  rem: 6,    // REM → Terra REM
  awake: 1,  // Awake → Terra Awake
};

/**
 * Map a Garmin sleep stage name to the Terra SleepLevel enum.
 * Returns 0 (Unknown) for unrecognized stages.
 */
export function mapSleepLevel(stage: string): number {
  return sleepLevelMap[stage] ?? 0;
}
