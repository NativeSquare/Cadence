import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Configures system bars (status bar + Android navigation bar)
 * for the Cadence app.
 *
 * - Status bar style follows color scheme (light/dark)
 * - Android navigation bar is hidden to provide immersive experience
 *   matching the prototype design (no visible system navigation)
 *
 * Reference: cadence-full-v9.jsx - no visible system navigation in prototype
 */
export function ThemeStatusBar() {
  const { colorScheme } = useColorScheme();
  const statusBarStyle = colorScheme === "dark" ? "light" : "dark";

  // Configure Android navigation bar on mount
  useEffect(() => {
    if (Platform.OS === "android") {
      // Hide the Android navigation bar for immersive experience
      NavigationBar.setVisibilityAsync("hidden");
      // Set behavior to allow swipe from edge to temporarily reveal
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  return <StatusBar style={statusBarStyle} />;
}
