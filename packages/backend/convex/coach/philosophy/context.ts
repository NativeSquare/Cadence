import { components } from "../../_generated/api";
import type { QueryCtx } from "../../_generated/server";
import {
  loadActiveAthletePlan,
  loadAthlete,
  loadOwnedBlock,
} from "../../agoge/helpers";
import type { PhilosophyContext, PhilosophyTrigger } from "./types";

export async function loadPhilosophyContext(
  ctx: QueryCtx,
  trigger: PhilosophyTrigger,
  args: Record<string, unknown>,
): Promise<PhilosophyContext | null> {
  const auth = await loadAthlete(ctx);
  if (!auth) return null;

  const activePlan = await loadActiveAthletePlan(ctx, auth.athlete._id);

  let currentBlock: PhilosophyContext["currentBlock"] = null;
  const blockId = typeof args.blockId === "string" ? args.blockId : undefined;
  if (
    blockId &&
    (trigger === "workout.create" || trigger === "workout.update")
  ) {
    const owned = await loadOwnedBlock(ctx, blockId);
    currentBlock = owned?.block ?? null;
  }

  let goalRace: PhilosophyContext["goalRace"] = null;
  if (activePlan?.targetRaceId) {
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      raceId: activePlan.targetRaceId,
    });
    goalRace = race ?? null;
  }

  return {
    athleteId: auth.athlete._id,
    athlete: auth.athlete,
    activePlan,
    currentBlock,
    goalRace,
    adjacentWorkouts: [],
  };
}
