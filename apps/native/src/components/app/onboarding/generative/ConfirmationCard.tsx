/**
 * Confirmation Card Component
 *
 * Displays collected data for user to verify or edit.
 * Supports inline editing and correction flow.
 *
 * Source: Story 2.6 - AC#1, AC#2, AC#3
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  TextInput as RNTextInput,
  Animated,
  Keyboard,
} from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { selectionFeedback, questionPause } from "@/lib/haptics";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import { Check, Edit3, ChevronDown, ChevronUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";

// =============================================================================
// Types
// =============================================================================

interface ConfirmationField {
  label: string;
  value: string;
  fieldPath: string;
  editable?: boolean;
}

interface ConfirmationArgs {
  title: string;
  fields: ConfirmationField[];
  confirmLabel?: string;
  editLabel?: string;
}

interface ConfirmationCardProps {
  toolCallId: string;
  args?: ConfirmationArgs;
  onSubmit: (result: {
    confirmed: boolean;
    edits?: Record<string, string>;
  }) => void;
  disabled?: boolean;
}

type CardState = "viewing" | "editing" | "confirmed";

// =============================================================================
// Component
// =============================================================================

export function ConfirmationCard({
  toolCallId,
  args,
  onSubmit,
  disabled = false,
}: ConfirmationCardProps) {
  const [cardState, setCardState] = useState<CardState>("viewing");
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [tempEditValue, setTempEditValue] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<RNTextInput>(null);

  const {
    title = "Please confirm",
    fields = [],
    confirmLabel = "Looks good!",
    editLabel = "Make changes",
  } = args ?? {};

  // Entrance animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingFieldIndex !== null) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [editingFieldIndex]);

  const getCurrentValue = useCallback(
    (field: ConfirmationField) => {
      return editedValues[field.fieldPath] ?? field.value;
    },
    [editedValues]
  );

  const handleConfirm = useCallback(() => {
    if (cardState === "confirmed" || disabled) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCardState("confirmed");

    // Animate checkmark
    Animated.spring(checkmarkScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    const hasEdits = Object.keys(editedValues).length > 0;
    onSubmit({
      confirmed: true,
      edits: hasEdits ? editedValues : undefined,
    });
  }, [cardState, disabled, editedValues, checkmarkScale, onSubmit]);

  const handleEdit = useCallback(() => {
    if (cardState === "confirmed" || disabled) return;

    selectionFeedback();
    setCardState("editing");
  }, [cardState, disabled]);

  const handleFieldEdit = useCallback(
    (index: number) => {
      const field = fields[index];
      if (!field?.editable || disabled) return;

      selectionFeedback();
      setEditingFieldIndex(index);
      setTempEditValue(getCurrentValue(field));
    },
    [fields, disabled, getCurrentValue]
  );

  const handleSaveFieldEdit = useCallback(() => {
    if (editingFieldIndex === null) return;

    const field = fields[editingFieldIndex];
    if (!field) return;

    Keyboard.dismiss();
    selectionFeedback();

    setEditedValues((prev) => ({
      ...prev,
      [field.fieldPath]: tempEditValue.trim(),
    }));
    setEditingFieldIndex(null);
    setTempEditValue("");
  }, [editingFieldIndex, fields, tempEditValue]);

  const handleCancelFieldEdit = useCallback(() => {
    Keyboard.dismiss();
    setEditingFieldIndex(null);
    setTempEditValue("");
  }, []);

  const handleDoneEditing = useCallback(() => {
    selectionFeedback();
    setCardState("viewing");
  }, []);

  // Don't render if no fields
  if (fields.length === 0) {
    return null;
  }

  const isDisabled = disabled || cardState === "confirmed";

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="gap-4">
      {/* Card container */}
      <View className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        {/* Header */}
        <View className="px-4 py-3 border-b border-white/10 flex-row items-center justify-between">
          <Text className="text-white/90 text-base font-medium">{title}</Text>
          {cardState === "confirmed" && (
            <Animated.View
              style={[
                { transform: [{ scale: checkmarkScale }] },
                { backgroundColor: COLORS.grn },
              ]}
              className="w-6 h-6 rounded-full items-center justify-center"
            >
              <Check size={14} color="#fff" />
            </Animated.View>
          )}
        </View>

        {/* Fields */}
        <View className="divide-y divide-white/5">
          {fields.map((field, index) => {
            const isEditing = editingFieldIndex === index;
            const currentValue = getCurrentValue(field);
            const wasEdited = editedValues[field.fieldPath] !== undefined;

            return (
              <View key={field.fieldPath} className="px-4 py-3">
                {isEditing ? (
                  // Editing mode for this field
                  <View className="gap-2">
                    <Text className="text-white/50 text-sm">{field.label}</Text>
                    <View className="flex-row items-center gap-2">
                      <RNTextInput
                        ref={inputRef}
                        value={tempEditValue}
                        onChangeText={setTempEditValue}
                        placeholder="Enter value..."
                        placeholderTextColor={GRAYS.g4}
                        returnKeyType="done"
                        onSubmitEditing={handleSaveFieldEdit}
                        className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-white text-base"
                      />
                      <Pressable
                        onPress={handleSaveFieldEdit}
                        className="p-2 bg-primary rounded-lg"
                      >
                        <Check size={18} color="#000" />
                      </Pressable>
                      <Pressable
                        onPress={handleCancelFieldEdit}
                        className="p-2 bg-white/10 rounded-lg"
                      >
                        <Text className="text-white/60 text-sm">Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  // View mode for this field
                  <Pressable
                    onPress={() => cardState === "editing" && handleFieldEdit(index)}
                    disabled={!field.editable || cardState !== "editing"}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-white/50 text-sm">{field.label}</Text>
                      <Text
                        className={cn(
                          "text-base mt-0.5",
                          wasEdited ? "text-primary" : "text-white/90"
                        )}
                      >
                        {currentValue || "—"}
                      </Text>
                    </View>
                    {cardState === "editing" && field.editable && (
                      <Edit3 size={16} color="rgba(255,255,255,0.4)" />
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Action buttons */}
      {cardState === "viewing" && !isDisabled && (
        <View className="flex-row gap-3">
          <Pressable
            onPress={handleConfirm}
            className="flex-1 bg-primary rounded-xl py-3.5 items-center active:bg-primary/90"
          >
            <Text className="text-primary-foreground font-semibold text-base">
              {confirmLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleEdit}
            className="flex-1 bg-white/10 rounded-xl py-3.5 items-center active:bg-white/20"
          >
            <Text className="text-white/70 font-medium text-base">
              {editLabel}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Done editing button */}
      {cardState === "editing" && editingFieldIndex === null && (
        <View className="flex-row gap-3">
          <Pressable
            onPress={handleConfirm}
            className="flex-1 bg-primary rounded-xl py-3.5 items-center active:bg-primary/90"
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Confirm Changes
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDoneEditing}
            className="flex-1 bg-white/10 rounded-xl py-3.5 items-center active:bg-white/20"
          >
            <Text className="text-white/70 font-medium text-base">
              Cancel
            </Text>
          </Pressable>
        </View>
      )}

      {/* Confirmed state - show success message */}
      {cardState === "confirmed" && (
        <View className="items-center py-2">
          <Text style={{ color: COLORS.grn }} className="text-sm">
            {Object.keys(editedValues).length > 0
              ? "Changes saved!"
              : "Confirmed!"}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
