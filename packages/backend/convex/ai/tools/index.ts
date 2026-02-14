import { tool } from "ai";
import { z } from "zod";

/**
 * Tool Registry for AI SDK
 *
 * Defines tools the LLM can call for generative UI components.
 * Tool execution happens server-side; results stream to client.
 *
 * Source: Story 2.1 - AC#1, AC#3
 */

/**
 * Multiple choice selection tool
 * Renders a list of options for user selection
 */
export const renderMultipleChoice = tool({
  description:
    "Display multiple choice options for user to select from. Use when you need the user to choose from predefined options.",
  inputSchema: z.object({
    question: z.string().optional().describe("Optional question text to display above options"),
    options: z
      .array(
        z.object({
          label: z.string().describe("Display text for this option"),
          value: z.string().describe("Value to store when selected"),
          description: z.string().optional().describe("Additional context for this option"),
          emoji: z.string().optional().describe("Optional emoji to display with option"),
        })
      )
      .describe("Array of options to display"),
    targetField: z
      .string()
      .describe("Runner Object field path to update (e.g., 'running.experienceLevel')"),
    allowMultiple: z
      .boolean()
      .default(false)
      .describe("Allow selecting multiple options"),
    allowSkip: z
      .boolean()
      .default(false)
      .describe("Show a skip option"),
  }),
});

/**
 * Open text input tool
 * Renders a text input field for free-form responses
 */
export const renderOpenInput = tool({
  description:
    "Display a text input field for free-form user input. Use when you need open-ended responses.",
  inputSchema: z.object({
    question: z.string().optional().describe("Question or prompt text"),
    placeholder: z.string().optional().describe("Placeholder text for the input"),
    targetField: z
      .string()
      .describe("Runner Object field path to update"),
    inputType: z
      .enum(["text", "number", "duration", "pace"])
      .default("text")
      .describe("Type of input to render"),
    validation: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
      })
      .optional()
      .describe("Validation rules for the input"),
    allowSkip: z
      .boolean()
      .default(false)
      .describe("Show a skip option"),
  }),
});

/**
 * Confirmation card tool
 * Displays data for user to confirm or edit
 */
export const renderConfirmation = tool({
  description:
    "Display a confirmation card showing collected data for user to verify. Use at phase transitions to confirm data before proceeding.",
  inputSchema: z.object({
    title: z.string().describe("Title for the confirmation card"),
    fields: z
      .array(
        z.object({
          label: z.string().describe("Display label for this field"),
          value: z.string().describe("Current value to display"),
          fieldPath: z.string().describe("Runner Object field path"),
          editable: z.boolean().default(true).describe("Allow user to edit this field"),
        })
      )
      .describe("Fields to display for confirmation"),
    confirmLabel: z.string().default("Looks good!").describe("Text for confirm button"),
    editLabel: z.string().default("Make changes").describe("Text for edit button"),
  }),
});

/**
 * Voice input tool
 * Triggers voice recording interface
 */
export const renderVoiceInput = tool({
  description:
    "Display voice input interface for hands-free responses. Use when voice input would be more natural than typing.",
  inputSchema: z.object({
    prompt: z.string().optional().describe("Prompt to display while recording"),
    targetField: z
      .string()
      .describe("Runner Object field path to update with transcription"),
    maxDuration: z
      .number()
      .default(60)
      .describe("Maximum recording duration in seconds"),
  }),
});

/**
 * Progress indicator tool
 * Shows conversation progress
 */
export const renderProgress = tool({
  description:
    "Display progress indicator showing how far along the conversation is. Use to give user context on completion.",
  inputSchema: z.object({
    currentPhase: z
      .enum(["intro", "data_bridge", "profile", "goals", "schedule", "health", "coaching", "analysis"])
      .describe("Current conversation phase"),
    completionPercentage: z.number().min(0).max(100).describe("Overall completion percentage"),
    phasesCompleted: z.array(z.string()).describe("List of completed phase names"),
    currentPhaseProgress: z.number().min(0).max(100).optional().describe("Progress within current phase"),
  }),
});

/**
 * Tool registry for AI SDK streamText
 */
export const tools = {
  renderMultipleChoice,
  renderOpenInput,
  renderConfirmation,
  renderVoiceInput,
  renderProgress,
};

export type ToolName = keyof typeof tools;
