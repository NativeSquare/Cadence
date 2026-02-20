/**
 * Mock Data for Coach Screen Development
 * Reference: cadence-full-v9.jsx INIT_MSGS and REPLIES (lines 249-261)
 *
 * Source: Story 10.3 - Task 9
 */

import type { ChatMessage, ToolMessage, DisplayMessage, MockReply } from "./types";

// =============================================================================
// Initial Messages
// =============================================================================

/**
 * Initial conversation messages matching the prototype
 * Reference: INIT_MSGS (lines 249-255)
 */
export const INITIAL_MESSAGES: DisplayMessage[] = [
  {
    id: "msg_1",
    role: "assistant",
    content:
      "Good morning! I see you nailed those 800m repeats yesterday - your splits were very consistent. How are your legs feeling today?",
    parts: [
      {
        type: "text",
        text: "Good morning! I see you nailed those 800m repeats yesterday - your splits were very consistent. How are your legs feeling today?",
      },
    ],
    isStreaming: false,
    createdAt: Date.now() - 60000,
  },
  {
    id: "msg_2",
    role: "user",
    content:
      "Legs feel okay, a bit tight in the calves. Was thinking of pushing harder today - maybe a tempo instead of easy?",
    parts: [
      {
        type: "text",
        text: "Legs feel okay, a bit tight in the calves. Was thinking of pushing harder today - maybe a tempo instead of easy?",
      },
    ],
    isStreaming: false,
    createdAt: Date.now() - 50000,
  },
  {
    id: "msg_3",
    role: "assistant",
    content:
      "I appreciate the motivation, but I'd advise against it. Your cumulative load is already high:",
    parts: [
      {
        type: "text",
        text: "I appreciate the motivation, but I'd advise against it. Your cumulative load is already high:",
      },
    ],
    isStreaming: false,
    createdAt: Date.now() - 40000,
  },
  {
    id: "tool_1",
    role: "tool",
    title: "Training Load",
    data: {
      acute: 312,
      chronic: 265,
      ratio: 1.18,
      note: "AC ratio 1.18 - caution zone.",
    },
  } as ToolMessage,
  {
    id: "msg_4",
    role: "assistant",
    content:
      "Your acute:chronic ratio is in the caution zone. Today's easy run lets you absorb the work. Trust the process.",
    parts: [
      {
        type: "text",
        text: "Your acute:chronic ratio is in the caution zone. Today's easy run lets you absorb the work. Trust the process.",
      },
    ],
    isStreaming: false,
    createdAt: Date.now() - 30000,
  },
];

// =============================================================================
// Mock Replies
// =============================================================================

/**
 * Mock replies for testing without AI backend
 * Reference: REPLIES (lines 256-261)
 */
export const MOCK_REPLIES: MockReply[] = [
  {
    text: "Based on your current load, I'd recommend keeping intensity moderate this week. We can push harder in Week 5.",
    delay: 1200,
  },
  {
    text: "Let me adjust - I'll swap Friday's rest with an easy 5km so you stay active without adding stress.",
    delay: 1400,
  },
  {
    text: "Your recovery has been solid. We could add 1km to Sunday's long run if you're feeling strong by Saturday.",
    delay: 1100,
  },
  {
    text: "I'll add a fartlek section - it keeps things fun while building speed endurance.",
    delay: 1300,
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the next mock reply in sequence
 */
let replyIndex = 0;
export function getNextMockReply(): MockReply {
  const reply = MOCK_REPLIES[replyIndex % MOCK_REPLIES.length];
  replyIndex++;
  return reply;
}

/**
 * Reset the mock reply index
 */
export function resetMockReplies(): void {
  replyIndex = 0;
}

/**
 * Check if a message is a tool message
 */
export function isToolMessage(message: DisplayMessage): message is ToolMessage {
  return message.role === "tool";
}

/**
 * Check if a message is a chat message
 */
export function isChatMessage(message: DisplayMessage): message is ChatMessage {
  return message.role === "user" || message.role === "assistant";
}
