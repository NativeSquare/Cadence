/**
 * Tests for Story 0.2 — EAS CLI and workflow validation (mocked child_process)
 *
 * These tests mock `child_process.execSync` to test:
 *  - Task 1.1: checkEasCli
 *  - Task 1.2: checkEasAuth
 *  - Task 3.1: validateWorkflow (entry point with EAS CLI fallback)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";

// Mock child_process at the module level (required for ESM)
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(execSync);

// Import modules AFTER mock registration
import { checkEasCli, checkEasAuth } from "../e2e-validation/validate-eas";
import { validateWorkflow } from "../e2e-validation/validate-workflow";
import { MC_CI_WORKFLOW_YAML } from "../e2e-validation/scaffold-cicd";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let tmpDir: string;

function makeTmpDir(): string {
  const dir = join(
    tmpdir(),
    `cadence-e2e-mock-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  tmpDir = makeTmpDir();
  vi.clearAllMocks();
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// =========================================================================
// Task 1.1 — checkEasCli
// =========================================================================
describe("Task 1.1: checkEasCli", () => {
  it("returns ok with version when eas CLI is available", () => {
    mockedExecSync.mockReturnValue("eas-cli/18.4.0\n" as any);

    const result = checkEasCli();
    expect(result.ok).toBe(true);
    expect(result.detail).toContain("eas-cli");
    expect(mockedExecSync).toHaveBeenCalledWith(
      "eas --version",
      expect.objectContaining({ encoding: "utf-8" })
    );
  });

  it("returns not ok when eas CLI is missing", () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("command not found: eas");
    });

    const result = checkEasCli();
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("not found");
  });
});

// =========================================================================
// Task 1.2 — checkEasAuth
// =========================================================================
describe("Task 1.2: checkEasAuth", () => {
  it("returns ok with username when authenticated", () => {
    mockedExecSync.mockReturnValue("Mission-control\n" as any);

    const result = checkEasAuth();
    expect(result.ok).toBe(true);
    expect(result.detail).toBe("Mission-control");
  });

  it("returns not ok when user is not logged in", () => {
    mockedExecSync.mockReturnValue("not logged in\n" as any);

    const result = checkEasAuth();
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("Not authenticated");
  });

  it("returns not ok when eas whoami throws", () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("EXPO_TOKEN not set");
    });

    const result = checkEasAuth();
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("EXPO_TOKEN");
  });
});

// =========================================================================
// Task 3.1 — validateWorkflow (entry point)
// =========================================================================
describe("Task 3.1: validateWorkflow (entry point)", () => {
  it("returns eas-cli result when eas workflow:validate succeeds", () => {
    const workflowPath = join(tmpDir, "workflow.yml");
    writeFileSync(workflowPath, MC_CI_WORKFLOW_YAML, "utf-8");

    mockedExecSync.mockReturnValue("✔ Workflow is valid\n" as any);

    const result = validateWorkflow(workflowPath);
    expect(result.valid).toBe(true);
    expect(result.method).toBe("eas-cli");
  });

  it("falls back to local parse when eas command is not recognized", () => {
    const workflowPath = join(tmpDir, "workflow.yml");
    writeFileSync(workflowPath, MC_CI_WORKFLOW_YAML, "utf-8");

    const err = new Error("command failed") as Error & { stderr: string };
    err.stderr = "is not a eas command";
    mockedExecSync.mockImplementation(() => {
      throw err;
    });

    const result = validateWorkflow(workflowPath);
    expect(result.valid).toBe(true);
    expect(result.method).toBe("local-parse");
  });

  it("returns eas-cli validation errors for real validation failures", () => {
    const workflowPath = join(tmpDir, "workflow.yml");
    writeFileSync(workflowPath, MC_CI_WORKFLOW_YAML, "utf-8");

    const err = new Error("validation failed") as Error & { stderr: string };
    err.stderr = "Error: invalid job reference";
    mockedExecSync.mockImplementation(() => {
      throw err;
    });

    const result = validateWorkflow(workflowPath);
    expect(result.valid).toBe(false);
    expect(result.method).toBe("eas-cli");
    expect(result.errors[0]).toContain("invalid job reference");
  });
});
