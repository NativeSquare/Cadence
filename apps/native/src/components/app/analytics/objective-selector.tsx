/**
 * ObjectiveSelector - Dropdown for switching race objectives in analytics.
 *
 * Renders as a pill button in the header that opens a bottom sheet-style
 * overlay with objective options. Selected objective changes all analytics data.
 */

import { useState, useRef } from "react";
import { Pressable, View, Modal } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import type { RaceObjective, ObjectiveOption } from "./mock-data";
import { OBJECTIVE_OPTIONS } from "./mock-data";

interface ObjectiveSelectorProps {
  selected: RaceObjective;
  onSelect: (objective: RaceObjective) => void;
  variant?: "dark" | "light";
}

const OBJECTIVE_ICONS: Record<RaceObjective, string> = {
  "5k": "5K",
  "10k": "10K",
  half: "21.1K",
  marathon: "42.2K",
};

export function ObjectiveSelector({
  selected,
  onSelect,
  variant = "dark",
}: ObjectiveSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = OBJECTIVE_OPTIONS.find((o) => o.id === selected)!;

  const handleSelect = (id: RaceObjective) => {
    onSelect(id);
    setOpen(false);
  };

  const isLight = variant === "light";

  return (
    <>
      {/* Trigger pill */}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-[6px] px-3 py-[6px] rounded-full"
        style={{
          backgroundColor: isLight
            ? "rgba(0,0,0,0.05)"
            : "rgba(255,255,255,0.08)",
        }}
      >
        <Text
          className={`text-[13px] font-coach-semibold ${isLight ? "text-wText" : "text-g1"}`}
          numberOfLines={1}
        >
          {selectedOption.label}
        </Text>
        <Text className={`text-[10px] ${isLight ? "text-wMute" : "text-g3"}`}>
          ▾
        </Text>
      </Pressable>

      {/* Overlay modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={() => setOpen(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              className="mx-4 mb-8 rounded-2xl overflow-hidden"
              style={{ backgroundColor: LIGHT_THEME.w1 }}
            >
              {/* Header */}
              <View className="px-5 pt-5 pb-3">
                <Text className="text-[15px] font-coach-bold text-wText">
                  Select Objective
                </Text>
                <Text className="text-[12px] font-coach text-wMute mt-1">
                  Analytics will adapt to your goal
                </Text>
              </View>

              {/* Options */}
              {OBJECTIVE_OPTIONS.map((option) => {
                const isSelected = option.id === selected;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleSelect(option.id)}
                    className="px-5 py-[14px] flex-row items-center justify-between"
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(200,255,0,0.06)"
                        : "transparent",
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{
                          backgroundColor: isSelected
                            ? COLORS.lime
                            : LIGHT_THEME.w3,
                        }}
                      >
                        <Text
                          className="text-[11px] font-coach-bold"
                          style={{
                            color: isSelected
                              ? COLORS.black
                              : LIGHT_THEME.wSub,
                          }}
                        >
                          {OBJECTIVE_ICONS[option.id]}
                        </Text>
                      </View>
                      <View>
                        <Text
                          className="text-[15px] font-coach-semibold"
                          style={{
                            color: isSelected
                              ? LIGHT_THEME.wText
                              : LIGHT_THEME.wSub,
                          }}
                        >
                          {option.label}
                        </Text>
                        <Text className="text-[11px] font-coach text-wMute">
                          {option.planWeeks}-week plan
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center"
                        style={{ backgroundColor: COLORS.lime }}
                      >
                        <Text
                          className="text-[11px] font-coach-bold"
                          style={{ color: COLORS.black }}
                        >
                          ✓
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}

              {/* Bottom padding */}
              <View className="h-3" />
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
