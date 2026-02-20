import { Text } from "@/components/ui/text";
import { COLORS } from "@/lib/design-tokens";
import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

export type ProfileHeaderProps = {
  name: string;
  avatarInitial: string;
  avatarUri?: string;
  isPro?: boolean;
  planPhase: string;
  planCompletion: number; // 0-1
  stats: {
    km: number;
    runs: number;
    streak: number;
  };
  scrollProgress: number; // 0-1 for opacity/scale animations
  onShareStrava?: () => void;
};

/**
 * Profile Header Component
 * Reference: cadence-full-v9.jsx ProfileTab (lines 626-656)
 *
 * Features:
 * - Avatar with animated progress ring (SVG circle)
 * - Name + PRO badge
 * - Plan phase subtitle
 * - Stats row (km, runs, streak)
 * - Share on Strava button
 * - Scroll-based opacity and scale animations
 */
export function ProfileHeader({
  name,
  avatarInitial,
  avatarUri,
  isPro = false,
  planPhase,
  planCompletion,
  stats,
  scrollProgress,
  onShareStrava,
}: ProfileHeaderProps) {
  // Progress ring animation state
  const [ringAnimated, setRingAnimated] = useState(false);

  // Trigger ring animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setRingAnimated(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // SVG circle calculations
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringAnimated
    ? ringCircumference * (1 - planCompletion)
    : ringCircumference;

  // Scroll-based animations
  const headerOpacity = 1 - scrollProgress * 0.8;
  const headerScale = 1 - scrollProgress * 0.3;
  const textOpacity = 1 - scrollProgress;
  const textTranslateY = -scrollProgress * 15;
  const statsOpacity = 1 - scrollProgress * 1.3;
  const statsTranslateY = -scrollProgress * 10;

  return (
    <View
      className="items-center bg-black px-6 pb-6 pt-[70px]"
      style={{ opacity: headerOpacity }}
    >
      {/* Avatar with Progress Ring */}
      <View
        className="relative mb-3"
        style={{
          width: 100,
          height: 100,
          transform: [{ scale: headerScale }],
        }}
      >
        {/* Progress Ring SVG */}
        <Svg
          width={100}
          height={100}
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: [{ rotate: "-90deg" }],
          }}
        >
          {/* Background circle */}
          <Circle
            cx={50}
            cy={50}
            r={ringRadius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={3}
          />
          {/* Progress circle */}
          <Circle
            cx={50}
            cy={50}
            r={ringRadius}
            fill="none"
            stroke={COLORS.lime}
            strokeWidth={3}
            strokeDasharray={ringCircumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>

        {/* Avatar */}
        <View
          className="absolute items-center justify-center rounded-full"
          style={{
            top: 7,
            left: 7,
            width: 86,
            height: 86,
            backgroundColor: COLORS.lime,
          }}
        >
          <Text className="font-coach-extrabold text-[38px] text-black">
            {avatarInitial}
          </Text>
        </View>
      </View>

      {/* Name and PRO Badge */}
      <View
        className="flex-row items-center justify-center"
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslateY }],
        }}
      >
        <Text className="font-coach-bold text-[22px] text-g1">{name}</Text>
        {isPro && (
          <View className="ml-2 rounded-lg bg-lime px-2.5 py-0.5">
            <Text className="font-coach-extrabold text-[10px] text-black">
              PRO
            </Text>
          </View>
        )}
      </View>

      {/* Plan Phase Subtitle */}
      <Text
        className="mt-1.5 font-coach text-[13px] text-g4"
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslateY }],
        }}
      >
        {planPhase}
      </Text>

      {/* Stats Row and Share Button */}
      <View
        className="mt-4 w-full"
        style={{
          opacity: statsOpacity,
          transform: [{ translateY: statsTranslateY }],
        }}
      >
        {/* Stats Cards */}
        <View className="mb-2.5 flex-row gap-1.5">
          {[
            { value: stats.km, label: "km" },
            { value: stats.runs, label: "runs" },
            { value: stats.streak, label: "streak" },
          ].map((stat, index) => (
            <View
              key={stat.label}
              className="flex-1 items-center rounded-xl border border-brd bg-card-surface py-2.5 px-1.5"
            >
              <Text className="font-coach-extrabold text-lg text-lime">
                {stat.value}
              </Text>
              <Text className="font-coach text-[10px] text-g4">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Share on Strava Button */}
        <Pressable
          onPress={onShareStrava}
          className="w-full flex-row items-center justify-center gap-2 rounded-[14px] bg-lime py-3.5 active:opacity-90"
        >
          <Ionicons name="share-outline" size={16} color="#000" />
          <Text className="font-coach-bold text-sm text-black">
            Share on Strava
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
