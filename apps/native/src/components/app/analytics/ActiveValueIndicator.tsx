/**
 * ActiveValueIndicator - Touch tooltip overlay for interactive charts
 *
 * Renders a vertical crosshair line, highlighted dot, and floating value label
 * driven by victory-native's useChartPressState shared values.
 * All drawing happens on the GPU via Skia.
 */

import {
  Circle,
  Line as SkiaLine,
  RoundedRect,
  Text as SkiaText,
  type SkFont,
} from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface ActiveValueIndicatorProps {
  xPosition: SharedValue<number>;
  yPosition: SharedValue<number>;
  top: number;
  bottom: number;
  /** Pre-formatted label text as a SharedValue (worklet-safe) */
  label: SharedValue<string>;
  font: SkFont | null;
  color?: string;
}

export function ActiveValueIndicator({
  xPosition,
  yPosition,
  top,
  bottom,
  label,
  font,
  color = COLORS.lime,
}: ActiveValueIndicatorProps) {
  const PILL_HEIGHT = 22;
  const PILL_Y = top - 6;

  const labelWidth = useDerivedValue(() => {
    if (!font) return 40;
    return Math.max(font.measureText(label.value).width + 18, 40);
  });

  const pillX = useDerivedValue(() => xPosition.value - labelWidth.value / 2);

  const textX = useDerivedValue(() => {
    if (!font) return xPosition.value;
    const tw = font.measureText(label.value).width;
    return xPosition.value - tw / 2;
  });

  const lineP1 = useDerivedValue(() => ({ x: xPosition.value, y: top }));
  const lineP2 = useDerivedValue(() => ({ x: xPosition.value, y: bottom }));

  return (
    <>
      {/* Vertical crosshair */}
      <SkiaLine
        p1={lineP1}
        p2={lineP2}
        color="rgba(255,255,255,0.08)"
        strokeWidth={1}
        style="stroke"
      />

      {/* Outer ring */}
      <Circle cx={xPosition} cy={yPosition} r={8} color={color} opacity={0.15} />
      {/* Filled dot */}
      <Circle cx={xPosition} cy={yPosition} r={5} color={color} />
      {/* Inner highlight */}
      <Circle cx={xPosition} cy={yPosition} r={2} color="#1A1A1A" />

      {/* Value pill background */}
      {font && (
        <>
          <RoundedRect
            x={pillX}
            y={PILL_Y}
            width={labelWidth}
            height={PILL_HEIGHT}
            r={7}
            color={GRAYS.g1}
          />
          <SkiaText
            x={textX}
            y={PILL_Y + 15}
            text={label}
            font={font}
            color="#1A1A1A"
          />
        </>
      )}
    </>
  );
}
