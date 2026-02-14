/**
 * Visual test component for streaming text and cursor.
 * Used to verify Story 2.9 implementation.
 *
 * This component can be rendered in a test screen to visually verify:
 * - Single StreamBlock with default speed (28ms)
 * - StreamBlock with custom speed
 * - Sequential StreamBlocks with delays
 * - Cursor blink timing (0.8s sharp on/off)
 * - Active/inactive toggling
 * - onDone callback firing
 */
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StreamBlock } from "@/components/app/onboarding/StreamBlock";
import { Cursor } from "@/components/app/onboarding/Cursor";
import { STREAM_CHAR_MS, CURSOR_BLINK_MS } from "@/lib/animations";
import { COLORS, GRAYS } from "@/lib/design-tokens";

export function StreamingTest() {
  const [active1, setActive1] = useState(false);
  const [active2, setActive2] = useState(false);
  const [sequenceActive, setSequenceActive] = useState(false);
  const [done1, setDone1] = useState(false);
  const [done2, setDone2] = useState(false);
  const [done3, setDone3] = useState(false);
  const [seqDoneCount, setSeqDoneCount] = useState(0);

  const resetSequence = () => {
    setSequenceActive(false);
    setSeqDoneCount(0);
    setTimeout(() => setSequenceActive(true), 100);
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-g1 text-xl font-coach mb-4">
        Streaming Text Test (Story 2.9)
      </Text>

      {/* Timing Constants */}
      <Text className="text-lime text-lg mb-2">Timing Constants</Text>
      <View className="mb-6">
        <Text className="text-g2 text-sm">
          STREAM_CHAR_MS: {STREAM_CHAR_MS}ms (character speed)
        </Text>
        <Text className="text-g2 text-sm">
          CURSOR_BLINK_MS: {CURSOR_BLINK_MS}ms (blink interval)
        </Text>
      </View>

      {/* Cursor Test */}
      <Text className="text-lime text-lg mb-2">Cursor Component (AC #2)</Text>
      <View className="mb-6 flex-row items-center gap-4">
        <View className="items-center">
          <Text className="text-g3 text-xs mb-1">visible=true</Text>
          <View className="h-8 justify-center">
            <Cursor visible={true} height={20} />
          </View>
        </View>
        <View className="items-center">
          <Text className="text-g3 text-xs mb-1">visible=false</Text>
          <View className="h-8 justify-center">
            <Cursor visible={false} height={20} />
          </View>
        </View>
        <View className="items-center">
          <Text className="text-g3 text-xs mb-1">color check</Text>
          <View
            className="w-4 h-5"
            style={{ backgroundColor: COLORS.lime }}
          />
          <Text className="text-g4 text-[10px]">#C8FF00</Text>
        </View>
      </View>

      {/* Single StreamBlock Test */}
      <Text className="text-lime text-lg mb-2">
        Single StreamBlock (AC #1, #3)
      </Text>
      <View className="mb-6">
        <Pressable
          onPress={() => {
            setActive1(false);
            setDone1(false);
            setTimeout(() => setActive1(true), 100);
          }}
          className="bg-lime px-4 py-2 rounded-md mb-4 self-start"
        >
          <Text className="text-black font-coach">
            {active1 ? "Reset & Restart" : "Start Streaming"}
          </Text>
        </Pressable>
        <View className="min-h-[60px] bg-g6 p-4 rounded-lg">
          <StreamBlock
            text="Hello! I'm your running coach. Let's build something great together."
            active={active1}
            onDone={() => setDone1(true)}
          />
        </View>
        <Text className="text-g3 text-xs mt-2">
          onDone fired: {done1 ? "Yes" : "No"}
        </Text>
      </View>

      {/* Custom Speed Test */}
      <Text className="text-lime text-lg mb-2">
        Custom Speed (AC #1 - speed prop)
      </Text>
      <View className="mb-6">
        <Pressable
          onPress={() => {
            setActive2(false);
            setDone2(false);
            setTimeout(() => setActive2(true), 100);
          }}
          className="bg-ora px-4 py-2 rounded-md mb-4 self-start"
        >
          <Text className="text-black font-coach">
            {active2 ? "Reset & Restart" : "Start Fast (10ms)"}
          </Text>
        </Pressable>
        <View className="min-h-[60px] bg-g6 p-4 rounded-lg">
          <StreamBlock
            text="This streams at 10ms per character - much faster than default!"
            speed={10}
            active={active2}
            onDone={() => setDone2(true)}
          />
        </View>
        <Text className="text-g3 text-xs mt-2">
          onDone fired: {done2 ? "Yes" : "No"}
        </Text>
      </View>

      {/* Delayed Start Test */}
      <Text className="text-lime text-lg mb-2">Delayed Start (AC #4)</Text>
      <View className="mb-6">
        <Pressable
          onPress={() => {
            setDone3(false);
            setDone3(false);
            // Force remount by toggling a key
          }}
          className="bg-blu px-4 py-2 rounded-md mb-4 self-start"
        >
          <Text className="text-black font-coach">Reset</Text>
        </Pressable>
        <View className="min-h-[60px] bg-g6 p-4 rounded-lg">
          <StreamBlock
            text="This message has a 1000ms delay before starting."
            delay={1000}
            active={true}
            onDone={() => setDone3(true)}
          />
        </View>
        <Text className="text-g3 text-xs mt-2">
          Note: Cursor should not appear until streaming actually begins (after 1s)
        </Text>
      </View>

      {/* Sequential StreamBlocks Test */}
      <Text className="text-lime text-lg mb-2">
        Sequential Streaming (AC #5)
      </Text>
      <View className="mb-6">
        <Pressable
          onPress={resetSequence}
          className="bg-lime px-4 py-2 rounded-md mb-4 self-start"
        >
          <Text className="text-black font-coach">
            {sequenceActive ? "Reset Sequence" : "Start Sequence"}
          </Text>
        </Pressable>
        <View className="bg-g6 p-4 rounded-lg gap-2">
          <StreamBlock
            text="First message streams immediately."
            delay={0}
            active={sequenceActive}
            size={18}
            onDone={() => setSeqDoneCount((c) => c + 1)}
          />
          <StreamBlock
            text="Second message starts after a delay."
            delay={2000}
            active={sequenceActive}
            size={18}
            onDone={() => setSeqDoneCount((c) => c + 1)}
          />
          <StreamBlock
            text="Third message appears last."
            delay={4000}
            active={sequenceActive}
            size={18}
            onDone={() => setSeqDoneCount((c) => c + 1)}
          />
        </View>
        <Text className="text-g3 text-xs mt-2">
          Messages completed: {seqDoneCount}/3 (only one cursor visible at a
          time)
        </Text>
      </View>

      {/* Active Control Test */}
      <Text className="text-lime text-lg mb-2">Active Control (AC #6)</Text>
      <View className="mb-6">
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1">
            <Text className="text-g3 text-xs mb-1">active=false</Text>
            <View className="min-h-[40px] bg-g6 p-2 rounded-lg">
              <StreamBlock
                text="This should NOT be visible"
                active={false}
              />
            </View>
            <Text className="text-g4 text-xs mt-1">
              (nothing should appear above)
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-g3 text-xs mb-1">active=true</Text>
            <View className="min-h-[40px] bg-g6 p-2 rounded-lg">
              <StreamBlock text="This IS visible" active={true} />
            </View>
          </View>
        </View>
      </View>

      {/* Typography Test */}
      <Text className="text-lime text-lg mb-2">Typography (size & color)</Text>
      <View className="mb-6 bg-g6 p-4 rounded-lg gap-4">
        <StreamBlock text="Size 18, default color" size={18} active={true} />
        <StreamBlock
          text="Size 26 (default), lime color"
          size={26}
          color={COLORS.lime}
          active={true}
        />
        <StreamBlock
          text="Size 32, g2 color (secondary)"
          size={32}
          color={GRAYS.g2}
          active={true}
        />
      </View>

      <View className="h-20" />
    </ScrollView>
  );
}
