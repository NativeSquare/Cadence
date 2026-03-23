/**
 * Tests for Story 0.2 — E2E / CI-CD Validation
 *
 * Covers:
 *  - Task 1: EAS CLI prerequisite validation
 *  - Task 2: CI/CD scaffolding
 *  - Task 3: Workflow YAML validation
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { checkProjectLinked } from "../e2e-validation/validate-eas";
import {
  runScaffolding,
  verifyEasJsonChannels,
  checkFingerprintPolicy,
  MC_CI_WORKFLOW_YAML,
  MAESTRO_SMOKE_FLOW_YAML,
} from "../e2e-validation/scaffold-cicd";
import { validateYamlStructure } from "../e2e-validation/validate-workflow";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let tmpDir: string;

function makeTmpDir(): string {
  const dir = join(tmpdir(), `cadence-e2e-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  tmpDir = makeTmpDir();
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// =========================================================================
// Task 1 — EAS prerequisites
// =========================================================================
describe("Task 1: EAS prerequisites", () => {
  describe("1.3: checkProjectLinked", () => {
    it("returns ok when eas.json + projectId exist", () => {
      writeFileSync(join(tmpDir, "eas.json"), "{}", "utf-8");
      writeFileSync(
        join(tmpDir, "app.config.ts"),
        `export default { extra: { eas: { projectId: "aaaa-bbbb-cccc" } } }`,
        "utf-8"
      );
      const result = checkProjectLinked(tmpDir);
      expect(result.ok).toBe(true);
      expect(result.detail).toContain("aaaa-bbbb-cccc");
    });

    it("returns not ok when eas.json is missing", () => {
      writeFileSync(
        join(tmpDir, "app.config.ts"),
        `export default { extra: { eas: { projectId: "abc" } } }`,
        "utf-8"
      );
      const result = checkProjectLinked(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.detail).toContain("eas.json not found");
    });

    it("returns not ok when projectId is missing from app.config.ts", () => {
      writeFileSync(join(tmpDir, "eas.json"), "{}", "utf-8");
      writeFileSync(
        join(tmpDir, "app.config.ts"),
        `export default { extra: {} }`,
        "utf-8"
      );
      const result = checkProjectLinked(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.detail).toContain("projectId not found");
    });

    it("returns not ok when app.config.ts is missing", () => {
      writeFileSync(join(tmpDir, "eas.json"), "{}", "utf-8");
      const result = checkProjectLinked(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.detail).toContain("app.config.ts not found");
    });
  });
});

// =========================================================================
// Task 2 — CI/CD scaffolding
// =========================================================================
describe("Task 2: CI/CD scaffolding", () => {
  describe("2.1: verifyEasJsonChannels", () => {
    it("skips when preview & production channels already present", () => {
      writeFileSync(
        join(tmpDir, "eas.json"),
        JSON.stringify({
          build: {
            preview: { channel: "preview" },
            production: { channel: "production" },
          },
        }),
        "utf-8"
      );
      const result = verifyEasJsonChannels(tmpDir);
      expect(result.skipped).toBe(true);
    });

    it("adds missing channels", () => {
      writeFileSync(
        join(tmpDir, "eas.json"),
        JSON.stringify({ build: { preview: {}, production: {} } }),
        "utf-8"
      );
      const result = verifyEasJsonChannels(tmpDir);
      expect(result.created).toBe(true);

      const updated = JSON.parse(readFileSync(join(tmpDir, "eas.json"), "utf-8"));
      expect(updated.build.preview.channel).toBe("preview");
      expect(updated.build.production.channel).toBe("production");
    });

    it("errors when eas.json not found", () => {
      const result = verifyEasJsonChannels(tmpDir);
      expect(result.error).toContain("not found");
    });
  });

  describe("2.1: checkFingerprintPolicy", () => {
    it("updates appVersion to fingerprint", () => {
      writeFileSync(
        join(tmpDir, "app.config.ts"),
        `runtimeVersion: { policy: "appVersion" }`,
        "utf-8"
      );
      const result = checkFingerprintPolicy(tmpDir);
      expect(result.created).toBe(true);

      const content = readFileSync(join(tmpDir, "app.config.ts"), "utf-8");
      expect(content).toContain('policy: "fingerprint"');
    });

    it("skips when fingerprint already set", () => {
      writeFileSync(
        join(tmpDir, "app.config.ts"),
        `runtimeVersion: { policy: "fingerprint" }`,
        "utf-8"
      );
      const result = checkFingerprintPolicy(tmpDir);
      expect(result.skipped).toBe(true);
    });
  });

  describe("2.1: runScaffolding", () => {
    it("creates workflow and maestro files", () => {
      // Setup minimal app dir
      writeFileSync(
        join(tmpDir, "eas.json"),
        JSON.stringify({
          build: {
            preview: { channel: "preview" },
            production: { channel: "production" },
          },
        }),
        "utf-8"
      );
      writeFileSync(
        join(tmpDir, "app.config.ts"),
        `runtimeVersion: { policy: "appVersion" }`,
        "utf-8"
      );

      const report = runScaffolding(tmpDir);

      // Workflow created
      const workflowPath = join(tmpDir, ".eas", "workflows", "mc-ci-test.yml");
      expect(existsSync(workflowPath)).toBe(true);
      expect(readFileSync(workflowPath, "utf-8")).toBe(MC_CI_WORKFLOW_YAML);

      // Maestro created
      const maestroPath = join(tmpDir, ".maestro", "smoke-test.yaml");
      expect(existsSync(maestroPath)).toBe(true);
      expect(readFileSync(maestroPath, "utf-8")).toBe(MAESTRO_SMOKE_FLOW_YAML);

      // No critical errors
      expect(report.hasCriticalErrors).toBe(false);
    });

    it("skips files that already exist", () => {
      writeFileSync(
        join(tmpDir, "eas.json"),
        JSON.stringify({
          build: {
            preview: { channel: "preview" },
            production: { channel: "production" },
          },
        }),
        "utf-8"
      );
      writeFileSync(
        join(tmpDir, "app.config.ts"),
        `runtimeVersion: { policy: "fingerprint" }`,
        "utf-8"
      );

      // Pre-create files
      const workflowDir = join(tmpDir, ".eas", "workflows");
      mkdirSync(workflowDir, { recursive: true });
      writeFileSync(join(workflowDir, "mc-ci-test.yml"), "existing", "utf-8");

      const maestroDir = join(tmpDir, ".maestro");
      mkdirSync(maestroDir, { recursive: true });
      writeFileSync(join(maestroDir, "smoke-test.yaml"), "existing", "utf-8");

      const report = runScaffolding(tmpDir);

      // All skipped, no critical errors
      expect(report.hasCriticalErrors).toBe(false);
      const workflowItem = report.items.find((i) => i.name === "EAS workflow");
      expect(workflowItem?.skipped).toBe(true);
      const maestroItem = report.items.find(
        (i) => i.name === "Maestro smoke test"
      );
      expect(maestroItem?.skipped).toBe(true);
    });

    it("report has 5 items", () => {
      writeFileSync(
        join(tmpDir, "eas.json"),
        JSON.stringify({
          build: {
            preview: { channel: "preview" },
            production: { channel: "production" },
          },
        }),
        "utf-8"
      );
      writeFileSync(
        join(tmpDir, "app.config.ts"),
        `runtimeVersion: { policy: "fingerprint" }`,
        "utf-8"
      );

      const report = runScaffolding(tmpDir);
      expect(report.items).toHaveLength(5);
    });
  });
});

// =========================================================================
// Task 3 — Workflow YAML validation
// =========================================================================
describe("Task 3: Workflow YAML validation", () => {
  describe("3.2: validateYamlStructure", () => {
    it("valid workflow passes", () => {
      const workflowPath = join(tmpDir, "workflow.yml");
      writeFileSync(workflowPath, MC_CI_WORKFLOW_YAML, "utf-8");

      const result = validateYamlStructure(workflowPath);
      expect(result.valid).toBe(true);
      expect(result.method).toBe("local-parse");
      expect(result.errors).toHaveLength(0);
    });

    it("missing file fails", () => {
      const result = validateYamlStructure(join(tmpDir, "nope.yml"));
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("not found");
    });

    it("invalid YAML fails", () => {
      const workflowPath = join(tmpDir, "bad.yml");
      writeFileSync(workflowPath, "{ broken: yaml: ::", "utf-8");

      const result = validateYamlStructure(workflowPath);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("YAML parse error");
    });

    it("empty YAML fails", () => {
      const workflowPath = join(tmpDir, "empty.yml");
      writeFileSync(workflowPath, "", "utf-8");

      const result = validateYamlStructure(workflowPath);
      expect(result.valid).toBe(false);
    });

    it("YAML missing jobs key fails", () => {
      const workflowPath = join(tmpDir, "nojobs.yml");
      writeFileSync(
        workflowPath,
        `name: Test\non:\n  push:\n    branches: [main]\n`,
        "utf-8"
      );

      const result = validateYamlStructure(workflowPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('"jobs"'))).toBe(true);
    });

    it("YAML missing name key fails", () => {
      const workflowPath = join(tmpDir, "noname.yml");
      writeFileSync(
        workflowPath,
        `on:\n  push:\n    branches: [main]\njobs:\n  build:\n    type: build\n`,
        "utf-8"
      );

      const result = validateYamlStructure(workflowPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('"name"'))).toBe(true);
    });

    it("YAML job without type or steps fails", () => {
      const workflowPath = join(tmpDir, "notype.yml");
      writeFileSync(
        workflowPath,
        `name: Test\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    platform: ios\n`,
        "utf-8"
      );

      const result = validateYamlStructure(workflowPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('"type" or "steps"'))).toBe(true);
    });

    it("YAML job with type but no name passes", () => {
      const workflowPath = join(tmpDir, "typeonly.yml");
      writeFileSync(
        workflowPath,
        `name: Test\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    type: build\n`,
        "utf-8"
      );

      const result = validateYamlStructure(workflowPath);
      expect(result.valid).toBe(true);
    });

    it("YAML job with steps instead of type passes", () => {
      const workflowPath = join(tmpDir, "steps.yml");
      writeFileSync(
        workflowPath,
        `name: Test\non:\n  push:\n    branches: [main]\njobs:\n  custom:\n    steps:\n      - run: echo hello\n`,
        "utf-8"
      );

      const result = validateYamlStructure(workflowPath);
      expect(result.valid).toBe(true);
    });
  });
});
