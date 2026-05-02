/**
 * DiagonalStripes - Subtle diagonal stripe texture for workout cards.
 * Uses react-native-svg with a pattern for cross-platform consistency.
 * Reference: cadence-calendar-final.jsx line 634
 */

import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";

export const DiagonalStripes = React.memo(function DiagonalStripes() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern
          id="stripes"
          x="0"
          y="0"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(135)"
        >
          <Line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#stripes)" />
    </Svg>
  );
});
