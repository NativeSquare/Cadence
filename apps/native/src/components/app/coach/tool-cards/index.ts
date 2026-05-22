/**
 * Tool-card registry — maps a tool name to its card component.
 *
 * The coach only has reading tools and the silent `rememberAboutAthlete`
 * memory tool. Reading tools render as a compact `ReadingToolPill`; the
 * memory tool renders nothing (the entry shows up in the athlete's Context
 * sheet instead).
 */

import { ReadingToolPill } from "./ReadingToolPill";
import type { ToolCardComponent } from "./types";

const SILENT_TOOLS = new Set(["rememberAboutAthlete"]);

export function resolveToolCard(toolName: string): ToolCardComponent | null {
  if (SILENT_TOOLS.has(toolName)) return null;
  return ReadingToolPill;
}

export type { ToolCardProps, ToolCardComponent } from "./types";
export { ReadingToolPill };
