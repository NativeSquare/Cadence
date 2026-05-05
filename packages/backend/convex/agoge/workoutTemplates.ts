import { workoutTemplatesValidator } from "@nativesquare/agoge/schema";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import {
  type MutationCtx,
  mutation,
  query,
  type QueryCtx,
} from "../_generated/server";
import {
  fail,
  loadAthlete,
  loadOwnedWorkoutTemplate,
  push,
  requireAuthError,
  result,
  validateWorkoutStructure,
  validateWorkoutTemplateOwnership,
  type ValidationError,
  type ValidationResult,
  validationResultValidator,
} from "./helpers";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const listMyWorkoutTemplates = query({
  args: {},
  handler: async (ctx) => {
    const auth = await loadAthlete(ctx);
    if (!auth) return [];
    return await ctx.runQuery(
      components.agoge.public.getWorkoutTemplatesByAthlete,
      { athleteId: auth.athlete._id },
    );
  },
});

export const getMyWorkoutTemplate = query({
  args: { templateId: v.string() },
  handler: async (ctx, { templateId }) => {
    const result = await loadOwnedWorkoutTemplate(ctx, templateId);
    return result?.template ?? null;
  },
});

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const createWorkoutTemplateArgs = workoutTemplatesValidator.omit(
  "athleteId",
  "sport",
);

async function checkCreateWorkoutTemplate(
  ctx: QueryCtx | MutationCtx,
  args: typeof createWorkoutTemplateArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const errors: ValidationError[] = [];
  const r = validateWorkoutStructure(args.content.structure);
  if (!r.ok) push(errors, r.error);
  return result(errors);
}

const updateWorkoutTemplateArgs = workoutTemplatesValidator
  .omit("athleteId", "sport")
  .partial()
  .extend({ templateId: v.string() });

async function checkUpdateWorkoutTemplate(
  ctx: QueryCtx | MutationCtx,
  args: typeof updateWorkoutTemplateArgs.type,
): Promise<ValidationResult> {
  const auth = await loadAthlete(ctx);
  if (!auth) return fail([requireAuthError]);
  const ownership = await validateWorkoutTemplateOwnership(
    ctx,
    args.templateId,
    auth.athlete._id,
  );
  if (ownership) return fail([ownership]);
  const errors: ValidationError[] = [];
  if (args.content?.structure !== undefined) {
    const r = validateWorkoutStructure(args.content.structure);
    if (!r.ok) push(errors, r.error);
  }
  return result(errors);
}

// ---------------------------------------------------------------------------
// Validate queries
// ---------------------------------------------------------------------------

export const validateCreate = query({
  args: createWorkoutTemplateArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkCreateWorkoutTemplate(ctx, args),
});

export const validateUpdate = query({
  args: updateWorkoutTemplateArgs.fields,
  returns: validationResultValidator,
  handler: (ctx, args) => checkUpdateWorkoutTemplate(ctx, args),
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function throwIfInvalid(validation: ValidationResult): void {
  if (!validation.ok) {
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      errors: validation.errors,
    });
  }
}

export const createWorkoutTemplate = mutation({
  args: createWorkoutTemplateArgs.fields,
  handler: async (ctx, args) => {
    throwIfInvalid(await checkCreateWorkoutTemplate(ctx, args));
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    return await ctx.runMutation(
      components.agoge.public.createWorkoutTemplate,
      {
        ...args,
        athleteId: auth.athlete._id,
        sport: "run",
      },
    );
  },
});

export const updateWorkoutTemplate = mutation({
  args: updateWorkoutTemplateArgs.fields,
  handler: async (ctx, args) => {
    throwIfInvalid(await checkUpdateWorkoutTemplate(ctx, args));
    const { templateId, ...patch } = args;
    await ctx.runMutation(components.agoge.public.updateWorkoutTemplate, {
      templateId,
      ...patch,
    });
    return null;
  },
});

export const deleteWorkoutTemplate = mutation({
  args: { templateId: v.string() },
  handler: async (ctx, { templateId }) => {
    const auth = await loadAthlete(ctx);
    if (!auth)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [requireAuthError],
      });
    const ownership = await validateWorkoutTemplateOwnership(
      ctx,
      templateId,
      auth.athlete._id,
    );
    if (ownership)
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        errors: [ownership],
      });
    await ctx.runMutation(components.agoge.public.deleteWorkoutTemplate, {
      templateId,
    });
    return null;
  },
});
