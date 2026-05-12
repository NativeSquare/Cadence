import type { QueryCtx } from "../../_generated/server";
import {
  loadAthlete,
  loadCurrentAthletePlan,
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

  const current = await loadCurrentAthletePlan(ctx, auth.athlete._id);

  let currentBlock: PhilosophyContext["currentBlock"] = null;
  const blockId = typeof args.blockId === "string" ? args.blockId : undefined;
  if (
    blockId &&
    (trigger === "workout.create" || trigger === "workout.update")
  ) {
    const owned = await loadOwnedBlock(ctx, blockId);
    currentBlock = owned?.block ?? null;
  }

  return {
    athleteId: auth.athlete._id,
    athlete: auth.athlete,
    activePlan: current?.plan ?? null,
    currentBlock,
    goalRace: current?.race ?? null,
    adjacentWorkouts: [],
  };
}
