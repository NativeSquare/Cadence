/**
 * WatermarkIcon - SVG watermark icons for session cards.
 * 4 types: easy (concentric circles), specific (bolt), long (mountain), race (trophy).
 * Reference: cadence-calendar-final.jsx lines 268-297
 *
 * Icons are defined at module level to avoid recreation per render.
 */

import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import type { CalSessionType } from "./types";

interface WatermarkIconProps {
  type: CalSessionType;
  size?: number;
  color?: string;
}

const DEFAULT_COLOR = "rgba(255,255,255,0.18)";
const STROKE_WIDTH = 1.8;

function EasyIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      <Circle
        cx={16}
        cy={16}
        r={11}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
      />
      <Circle
        cx={16}
        cy={16}
        r={5}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
      />
    </Svg>
  );
}

function SpecificIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      <Path
        d="M17 3L6 18h7l-1.5 11L23 14h-7l1-11z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LongIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      <Path
        d="M4 24l6-12 5 6 5-9 8 15"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 24h24"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RaceIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      <Path
        d="M8 5h16v8c0 4.4-3.6 8-8 8s-8-3.6-8-8V5z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 21v4"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 28h12"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 5h3"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24 5h3"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const WatermarkIcon = React.memo(function WatermarkIcon({
  type,
  size = 30,
  color = DEFAULT_COLOR,
}: WatermarkIconProps) {
  switch (type) {
    case "easy":
      return <EasyIcon size={size} color={color} />;
    case "specific":
      return <SpecificIcon size={size} color={color} />;
    case "long":
      return <LongIcon size={size} color={color} />;
    case "race":
      return <RaceIcon size={size} color={color} />;
  }
});
