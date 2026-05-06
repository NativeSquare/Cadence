import type { QueryCtx } from "../../_generated/server";
import type {
  PhilosophyContext,
  PhilosophyResult,
  PhilosophyRule,
  PhilosophyViolation,
} from "./types";

export async function runRules(
  rules: PhilosophyRule[],
  input: unknown,
  context: PhilosophyContext,
  qctx: QueryCtx,
): Promise<PhilosophyResult> {
  const errors: PhilosophyViolation[] = [];
  const warnings: PhilosophyViolation[] = [];

  for (const rule of rules) {
    const violation = await rule.check(input, context, qctx);
    if (!violation) continue;
    const tagged: PhilosophyViolation = {
      code: `philosophy.${rule.id}`,
      message: violation.message,
    };
    if (rule.severity === "block") errors.push(tagged);
    else warnings.push(tagged);
  }

  return errors.length === 0
    ? { ok: true, warnings }
    : { ok: false, errors, warnings };
}
