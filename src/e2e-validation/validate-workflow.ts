/**
 * Workflow YAML validation for Story 0.2 (E2E / CI-CD pipeline).
 *
 * Attempts `eas workflow:validate`, falls back to local YAML structure check.
 */
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { parse as parseYaml } from "yaml";

export interface WorkflowValidationResult {
  valid: boolean;
  method: "eas-cli" | "local-parse";
  errors: string[];
}

/** 3.1 — try eas workflow:validate */
function tryEasValidate(workflowPath: string): WorkflowValidationResult | null {
  try {
    execSync(`eas workflow:validate "${workflowPath}"`, {
      encoding: "utf-8",
      timeout: 15_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { valid: true, method: "eas-cli", errors: [] };
  } catch (e: unknown) {
    const stderr =
      e instanceof Error && "stderr" in e ? String((e as any).stderr) : "";
    // If the command doesn't exist, return null to fall back
    if (
      stderr.includes("is not a eas command") ||
      stderr.includes("Unknown command") ||
      stderr.includes("not recognized")
    ) {
      return null;
    }
    // Real validation error
    return {
      valid: false,
      method: "eas-cli",
      errors: [stderr || "eas workflow:validate failed"],
    };
  }
}

/** 3.2 — local YAML structure check */
export function validateYamlStructure(
  workflowPath: string
): WorkflowValidationResult {
  const errors: string[] = [];

  if (!existsSync(workflowPath)) {
    return {
      valid: false,
      method: "local-parse",
      errors: [`Workflow file not found: ${workflowPath}`],
    };
  }

  const raw = readFileSync(workflowPath, "utf-8");

  // Parse YAML
  let doc: Record<string, unknown>;
  try {
    doc = parseYaml(raw) as Record<string, unknown>;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      valid: false,
      method: "local-parse",
      errors: [`YAML parse error: ${message}`],
    };
  }

  if (typeof doc !== "object" || doc === null) {
    errors.push("Workflow must be a YAML mapping (object)");
    return { valid: false, method: "local-parse", errors };
  }

  // Verify required top-level keys
  if (!doc.name) {
    errors.push('Workflow is missing required "name" field');
  }

  if (!doc.on) {
    errors.push('Workflow is missing required "on" trigger field');
  }

  if (!doc.jobs || typeof doc.jobs !== "object") {
    errors.push('Workflow is missing required "jobs" field');
    return { valid: false, method: "local-parse", errors };
  }

  // Check each job has required fields
  const jobs = doc.jobs as Record<string, unknown>;
  const jobKeys = Object.keys(jobs);
  if (jobKeys.length === 0) {
    errors.push("Workflow has no jobs defined");
  }

  for (const key of jobKeys) {
    const job = jobs[key] as Record<string, unknown> | undefined;
    if (typeof job !== "object" || job === null) {
      errors.push(`Job "${key}" must be a mapping`);
      continue;
    }
    if (!job.type && !job.steps) {
      errors.push(`Job "${key}" must have either "type" or "steps"`);
    }
  }

  return {
    valid: errors.length === 0,
    method: "local-parse",
    errors,
  };
}

/** Validate workflow — tries eas-cli first, falls back to local parse */
export function validateWorkflow(
  workflowPath: string
): WorkflowValidationResult {
  const easResult = tryEasValidate(workflowPath);
  if (easResult !== null) {
    return easResult;
  }
  // eas workflow:validate not available, fall back to local
  return validateYamlStructure(workflowPath);
}
