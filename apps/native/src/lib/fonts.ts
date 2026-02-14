/**
 * Font configuration for Cadence app.
 * Loads Outfit (coach voice) and JetBrains Mono (data/terminal).
 *
 * Uses @expo-google-fonts packages for bundled font loading.
 */
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

/**
 * Font assets map for expo-font useFonts hook.
 * Keys are font family names used in styles.
 */
export const fontAssets = {
  "Outfit-Light": Outfit_300Light,
  "Outfit-Regular": Outfit_400Regular,
  "Outfit-Medium": Outfit_500Medium,
  "Outfit-SemiBold": Outfit_600SemiBold,
  "Outfit-Bold": Outfit_700Bold,
  "JetBrainsMono-Regular": JetBrainsMono_400Regular,
  "JetBrainsMono-Medium": JetBrainsMono_500Medium,
} as const;

/** Font family names for NativeWind/Tailwind */
export const FONT_FAMILY = {
  /** Outfit - coach voice, UI text */
  coach: "Outfit",
  /** JetBrains Mono - data, terminal output */
  mono: "JetBrainsMono",
} as const;
