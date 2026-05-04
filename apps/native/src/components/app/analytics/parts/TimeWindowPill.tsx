import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { WINDOW_LABEL, type WindowKey } from "../inventory";

type Props = {
  value: WindowKey;
  options: WindowKey[];
  onChange: (next: WindowKey) => void;
};

export function TimeWindowPill({ value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const interactive = options.length > 1;

  return (
    <>
      <Pressable
        disabled={!interactive}
        onPress={() => setOpen(true)}
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full bg-w3"
      >
        <Text className="text-[13px] font-coach-medium text-wSub">
          {WINDOW_LABEL[value]}
        </Text>
        {interactive ? (
          <ChevronDown size={14} color={LIGHT_THEME.wMute} strokeWidth={2.5} />
        ) : null}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-w1 rounded-t-3xl px-5 pt-4 pb-8"
          >
            <View className="self-center w-10 h-1 rounded-full bg-w3 mb-4" />
            <Text className="text-[13px] font-coach-semibold text-wMute uppercase tracking-wider mb-3">
              Time window
            </Text>
            {options.map((opt) => {
              const active = opt === value;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`py-4 px-3 rounded-xl ${active ? "bg-w3" : ""}`}
                >
                  <Text
                    className={`text-[16px] ${
                      active
                        ? "font-coach-semibold text-wText"
                        : "font-coach text-wText"
                    }`}
                  >
                    {WINDOW_LABEL[opt]}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
