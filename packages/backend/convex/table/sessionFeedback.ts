import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { hasPro } from "./users";

/**
 * Post-session qualitative feedback captured as a voice recording. This is the
 * core of Cadence's wedge: the raw audio is stored and played back as-is — no
 * transcription. The recording itself is the qualitative signal (tone,
 * hesitations, feeling) and the asset for any future processing.
 */
const documentSchema = {
  userId: v.id("users"),
  workoutId: v.string(), // Agoge workout id (workouts live in the Agoge component)
  audioStorageId: v.id("_storage"),
  durationMs: v.number(),
  createdAt: v.number(),
};

export const sessionFeedback = defineTable(documentSchema)
  .index("by_workout", ["workoutId"])
  .index("by_user", ["userId"]);

/**
 * Persist a post-session voice recording. The audio has already been uploaded
 * to storage by the client; we only store its handle plus metadata.
 */
export const recordForWorkout = mutation({
  args: {
    workoutId: v.string(),
    audioStorageId: v.id("_storage"),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    if (!(await hasPro(ctx, userId))) {
      throw new ConvexError({
        code: "SUBSCRIPTION_REQUIRED",
        message: "An active Cadence Pro subscription is required.",
      });
    }

    return await ctx.db.insert("sessionFeedback", {
      userId,
      workoutId: args.workoutId,
      audioStorageId: args.audioStorageId,
      durationMs: args.durationMs,
      createdAt: Date.now(),
    });
  },
});

/**
 * Latest voice note for a workout, with a playable audio URL. Auth-scoped to
 * the owner. Used by the workout detail page to play back the recording.
 */
export const getForWorkout = query({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const row = await ctx.db
      .query("sessionFeedback")
      .withIndex("by_workout", (q) => q.eq("workoutId", workoutId))
      .order("desc")
      .first();
    if (!row || row.userId !== userId) return null;
    const audioUrl = await ctx.storage.getUrl(row.audioStorageId);
    return { ...row, audioUrl };
  },
});
