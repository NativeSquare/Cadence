import React from "react";
import Svg, { G, Path } from "react-native-svg";

type LogoProps = {
  size?: number;
  color?: string;
};

export function StravaLogo({ size = 20, color = "#FC4C02" }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </Svg>
  );
}

export function AppleHealthLogo({ size = 20, color = "#FF2D55" }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.205 4.791a5.938 5.938 0 0 0-4.209-1.754A5.906 5.906 0 0 0 12 4.595a5.904 5.904 0 0 0-3.996-1.558 5.942 5.942 0 0 0-4.213 1.758c-2.353 2.363-2.352 6.059.002 8.412L12 21.414l8.207-8.207c2.354-2.353 2.355-6.049-.002-8.416z" />
    </Svg>
  );
}

export function GarminLogo({ size = 20, color = "#007CC3" }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M22.017 22.67H1.984c-.77 0-1.388-.383-1.694-1.002-.387-.61-.387-1.39 0-2.002L10.304 2.33c.385-.615 1.002-1 1.695-1 .77 0 1.386.385 1.69 1l10.02 17.336c.387.617.387 1.39 0 2.002-.31.695-.927 1.002-1.693 1.002z" />
    </Svg>
  );
}

export function CorosLogo({ size = 20, color = "#E31937" }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" fill={color}>
      <Path d="M611.286 226.385l313.26 182.007.53 377.932-312.73 181.118-52.832-28.513 245.177-182.368-.466-318.704-242.02-183.045 49.082-28.428zM171.16 335.14l34.868 304.15 275.383 158.96 279.049-118.711v56.856L446.692 917.512 120.108 728.96V366.788l51.03-31.627zM569.195 56.558l312.73 181.118 1.8 60.14-280.043-121.805-274.918 159.765-37.028 301.757-49.061-28.428.508-363.125L569.195 56.558z" />
    </Svg>
  );
}
