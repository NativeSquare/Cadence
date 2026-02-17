/**
 * Conversation Persistence
 *
 * Utilities for saving and restoring conversation progress to local storage.
 * Used when LLM retries are exhausted to preserve user's work.
 *
 * Source: Story 8.3 - AC#3 (user's progress is saved locally)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MessagePart } from "@/lib/ai-stream";

// =============================================================================
// Types
// =============================================================================

export interface SavedConversation {
  /** Unique ID for the saved conversation */
  id: string;
  /** When the conversation was saved */
  savedAt: number;
  /** Conversation ID from the backend (if any) */
  conversationId?: string;
  /** All messages in the conversation */
  messages: SavedMessage[];
  /** The last user input that failed */
  lastUserInput?: string;
  /** Error information if saved due to error */
  errorInfo?: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export interface SavedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  createdAt: number;
  isInterrupted?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY_PREFIX = "@cadence/conversation/";
const MAX_SAVED_CONVERSATIONS = 5;

// =============================================================================
// Save Conversation
// =============================================================================

/**
 * Save conversation progress to AsyncStorage.
 * Called when LLM retries are exhausted.
 *
 * Source: Story 8.3 Task 4.2
 */
export async function saveConversationProgress(
  conversation: Omit<SavedConversation, "id" | "savedAt">
): Promise<string> {
  const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const savedConversation: SavedConversation = {
    ...conversation,
    id,
    savedAt: Date.now(),
  };

  try {
    // Save the new conversation
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    await AsyncStorage.setItem(key, JSON.stringify(savedConversation));

    // Cleanup old conversations if we have too many
    await cleanupOldConversations();

    console.log(`[ConversationPersistence] Saved conversation ${id}`);
    return id;
  } catch (error) {
    console.error("[ConversationPersistence] Failed to save conversation:", error);
    throw error;
  }
}

/**
 * Load a saved conversation by ID.
 */
export async function loadSavedConversation(
  id: string
): Promise<SavedConversation | null> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    const data = await AsyncStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as SavedConversation;
  } catch (error) {
    console.error("[ConversationPersistence] Failed to load conversation:", error);
    return null;
  }
}

/**
 * Get all saved conversations, sorted by most recent first.
 */
export async function getAllSavedConversations(): Promise<SavedConversation[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const conversationKeys = allKeys.filter((key) =>
      key.startsWith(STORAGE_KEY_PREFIX)
    );

    if (conversationKeys.length === 0) return [];

    const results = await AsyncStorage.multiGet(conversationKeys);
    const conversations: SavedConversation[] = results
      .map(([, value]) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as SavedConversation;
        } catch {
          return null;
        }
      })
      .filter((c): c is SavedConversation => c !== null);

    // Sort by savedAt descending (most recent first)
    conversations.sort((a, b) => b.savedAt - a.savedAt);

    return conversations;
  } catch (error) {
    console.error("[ConversationPersistence] Failed to get all conversations:", error);
    return [];
  }
}

/**
 * Delete a saved conversation.
 */
export async function deleteSavedConversation(id: string): Promise<void> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);
    console.log(`[ConversationPersistence] Deleted conversation ${id}`);
  } catch (error) {
    console.error("[ConversationPersistence] Failed to delete conversation:", error);
  }
}

/**
 * Get the most recent saved conversation.
 */
export async function getMostRecentConversation(): Promise<SavedConversation | null> {
  const conversations = await getAllSavedConversations();
  return conversations.length > 0 ? conversations[0] : null;
}

/**
 * Check if there are any saved conversations.
 */
export async function hasSavedConversations(): Promise<boolean> {
  const conversations = await getAllSavedConversations();
  return conversations.length > 0;
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Remove old conversations if we exceed the max limit.
 */
async function cleanupOldConversations(): Promise<void> {
  try {
    const conversations = await getAllSavedConversations();
    if (conversations.length <= MAX_SAVED_CONVERSATIONS) return;

    // Remove oldest conversations beyond the limit
    const toDelete = conversations.slice(MAX_SAVED_CONVERSATIONS);
    const keysToDelete = toDelete.map((c) => `${STORAGE_KEY_PREFIX}${c.id}`);

    await AsyncStorage.multiRemove(keysToDelete);
    console.log(
      `[ConversationPersistence] Cleaned up ${keysToDelete.length} old conversations`
    );
  } catch (error) {
    console.error("[ConversationPersistence] Failed to cleanup old conversations:", error);
  }
}

/**
 * Clear all saved conversations.
 */
export async function clearAllSavedConversations(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const conversationKeys = allKeys.filter((key) =>
      key.startsWith(STORAGE_KEY_PREFIX)
    );

    if (conversationKeys.length > 0) {
      await AsyncStorage.multiRemove(conversationKeys);
      console.log(
        `[ConversationPersistence] Cleared ${conversationKeys.length} conversations`
      );
    }
  } catch (error) {
    console.error("[ConversationPersistence] Failed to clear conversations:", error);
  }
}
