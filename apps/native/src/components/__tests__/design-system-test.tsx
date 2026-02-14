/**
 * Visual test component for design tokens and animations.
 * Used to verify Story 2.8 implementation.
 *
 * This component can be rendered in a test screen to visually verify:
 * - Color tokens render correctly
 * - Gray scale tokens display properly
 * - Surface tokens work as expected
 * - Fonts load and display correctly
 * - All animation presets execute
 */
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";
import {
  STREAM_CHAR_MS,
  CURSOR_BLINK_MS,
  MINI_ANALYSIS_LINE_MS,
  SPRING_DURATION_MS,
  PROGRESS_BAR_MS,
} from "@/lib/animations";
import {
  useSpringUp,
  useFadeUp,
  useScaleIn,
  usePulseGlow,
  useBlinkCursor,
  useCheckPop,
  useShimmer,
  useSpin,
  useGrowBar,
} from "@/lib/use-animations";

function ColorSwatch({ name, color }: { name: string; color: string }) {
  return (
    <View className="items-center mr-3 mb-3">
      <View
        className="w-12 h-12 rounded-md border border-g5"
        style={{ backgroundColor: color }}
      />
      <Text className="text-g2 text-xs mt-1">{name}</Text>
    </View>
  );
}

function AnimationDemo({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text className="text-g2 text-sm mb-2">{title}</Text>
      <View className="h-16 justify-center">{children}</View>
    </View>
  );
}

export function DesignSystemTest() {
  const [trigger, setTrigger] = useState(false);
  const [checked, setChecked] = useState(false);

  // Animation hooks
  const springUpStyle = useSpringUp(trigger);
  const fadeUpStyle = useFadeUp(trigger, 100);
  const scaleInStyle = useScaleIn(trigger, 200);
  const pulseStyle = usePulseGlow();
  const blinkStyle = useBlinkCursor(true);
  const checkPopStyle = useCheckPop(checked);
  const shimmerStyle = useShimmer();
  const spinStyle = useSpin();
  const growBarStyle = useGrowBar(trigger);

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-g1 text-xl font-coach mb-4">
        Design System Test
      </Text>

      {/* Color Tokens */}
      <Text className="text-lime text-lg mb-2">Color Tokens</Text>
      <View className="flex-row flex-wrap mb-6">
        <ColorSwatch name="lime" color={COLORS.lime} />
        <ColorSwatch name="lime-dim" color={COLORS.limeDim} />
        <ColorSwatch name="lime-glow" color={COLORS.limeGlow} />
        <ColorSwatch name="ora" color={COLORS.ora} />
        <ColorSwatch name="ora-dim" color={COLORS.oraDim} />
        <ColorSwatch name="red" color={COLORS.red} />
        <ColorSwatch name="red-dim" color={COLORS.redDim} />
        <ColorSwatch name="blu" color={COLORS.blu} />
        <ColorSwatch name="blu-dim" color={COLORS.bluDim} />
      </View>

      {/* Gray Scale */}
      <Text className="text-lime text-lg mb-2">Gray Scale</Text>
      <View className="flex-row flex-wrap mb-6">
        <ColorSwatch name="g1" color={GRAYS.g1} />
        <ColorSwatch name="g2" color={GRAYS.g2} />
        <ColorSwatch name="g3" color={GRAYS.g3} />
        <ColorSwatch name="g4" color={GRAYS.g4} />
        <ColorSwatch name="g5" color={GRAYS.g5} />
        <ColorSwatch name="g6" color={GRAYS.g6} />
      </View>

      {/* Surface Tokens */}
      <Text className="text-lime text-lg mb-2">Surface Tokens</Text>
      <View className="flex-row flex-wrap mb-6">
        <ColorSwatch name="brd" color={SURFACES.brd} />
        <ColorSwatch name="card" color={SURFACES.card} />
        <ColorSwatch name="sb" color={SURFACES.sb} />
        <ColorSwatch name="sg" color={SURFACES.sg} />
      </View>

      {/* Typography */}
      <Text className="text-lime text-lg mb-2">Typography</Text>
      <View className="mb-6">
        <Text className="text-g1 font-coach text-base">
          Coach font (Outfit) - Regular
        </Text>
        <Text className="text-g2 font-mono text-sm">
          Mono font (JetBrains Mono) - Data display
        </Text>
      </View>

      {/* Timing Constants */}
      <Text className="text-lime text-lg mb-2">Timing Constants</Text>
      <View className="mb-6">
        <Text className="text-g2 text-sm">
          STREAM_CHAR_MS: {STREAM_CHAR_MS}ms
        </Text>
        <Text className="text-g2 text-sm">
          CURSOR_BLINK_MS: {CURSOR_BLINK_MS}ms
        </Text>
        <Text className="text-g2 text-sm">
          MINI_ANALYSIS_LINE_MS: {MINI_ANALYSIS_LINE_MS}ms
        </Text>
        <Text className="text-g2 text-sm">
          SPRING_DURATION_MS: {SPRING_DURATION_MS}ms
        </Text>
        <Text className="text-g2 text-sm">
          PROGRESS_BAR_MS: {PROGRESS_BAR_MS}ms
        </Text>
      </View>

      {/* Animation Controls */}
      <Text className="text-lime text-lg mb-2">Animations</Text>
      <Pressable
        onPress={() => setTrigger((t) => !t)}
        className="bg-lime px-4 py-2 rounded-md mb-4 self-start"
      >
        <Text className="text-black font-coach">
          {trigger ? "Reset Animations" : "Trigger Animations"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setChecked((c) => !c)}
        className="bg-ora px-4 py-2 rounded-md mb-4 self-start"
      >
        <Text className="text-black font-coach">Toggle Check</Text>
      </Pressable>

      {/* Animation Demos */}
      <AnimationDemo title="Spring Up">
        <Animated.View
          style={springUpStyle}
          className="w-16 h-8 bg-lime rounded"
        />
      </AnimationDemo>

      <AnimationDemo title="Fade Up">
        <Animated.View
          style={fadeUpStyle}
          className="w-16 h-8 bg-ora rounded"
        />
      </AnimationDemo>

      <AnimationDemo title="Scale In">
        <Animated.View
          style={scaleInStyle}
          className="w-16 h-8 bg-blu rounded"
        />
      </AnimationDemo>

      <AnimationDemo title="Pulse Glow (infinite)">
        <Animated.View
          style={pulseStyle}
          className="w-16 h-8 bg-lime rounded"
        />
      </AnimationDemo>

      <AnimationDemo title="Blink Cursor (infinite)">
        <Animated.View
          style={blinkStyle}
          className="w-1 h-6 bg-lime rounded"
        />
      </AnimationDemo>

      <AnimationDemo title="Check Pop">
        <Animated.View
          style={checkPopStyle}
          className="w-8 h-8 bg-lime rounded-full items-center justify-center"
        >
          <Text className="text-black">✓</Text>
        </Animated.View>
      </AnimationDemo>

      <AnimationDemo title="Shimmer (infinite)">
        <Animated.View
          style={shimmerStyle}
          className="w-32 h-4 bg-g4 rounded"
        />
      </AnimationDemo>

      <AnimationDemo title="Spin (infinite)">
        <Animated.View
          style={spinStyle}
          className="w-8 h-8 border-2 border-lime border-t-transparent rounded-full"
        />
      </AnimationDemo>

      <AnimationDemo title="Grow Bar">
        <View className="h-8 w-4 justify-end">
          <Animated.View
            style={[growBarStyle, { transformOrigin: "bottom" }]}
            className="w-4 h-8 bg-lime rounded"
          />
        </View>
      </AnimationDemo>

      <View className="h-20" />
    </ScrollView>
  );
}
