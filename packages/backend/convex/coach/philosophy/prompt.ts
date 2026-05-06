import { ALL_RULES } from "./registry";

/**
 * Renders the active Philosophy rules as a system-prompt section. The Coach
 * agent injects this verbatim into its instructions so the LLM knows what
 * server-enforced policy it must respect — and which error codes belong to
 * the Philosophy layer (versus Agoge's domain validation).
 */
export function renderPhilosophy(): string {
  if (ALL_RULES.length === 0) return "";
  const lines = ALL_RULES.map(
    (r) =>
      `- (${r.severity}) ${r.description} [code: philosophy.${r.id}]`,
  );
  return [
    "Coaching Philosophy — server-enforced rules. Errors with codes prefixed `philosophy.` come from this layer (not Agoge); fix the args and silently retry the same way you would for any { ok: false } response:",
    ...lines,
  ].join("\n");
}
