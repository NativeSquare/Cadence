/**
 * CI/CD scaffolding for Story 0.2 (E2E / CI-CD pipeline).
 *
 * Creates:
 *  - .eas/workflows/mc-ci-test.yml  (EAS workflow)
 *  - .maestro/smoke-test.yaml       (Maestro E2E flow)
 *  - Ensures eas.json has preview/production channels
 *  - Ensures app.config.ts has fingerprint runtime policy
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

export interface ScaffoldItem {
  name: string;
  path: string;
  created: boolean;
  skipped: boolean;
  error?: string;
}

export interface ScaffoldReport {
  items: ScaffoldItem[];
  hasCriticalErrors: boolean;
}

// ---------------------------------------------------------------------------
// EAS workflow YAML
// ---------------------------------------------------------------------------
export const MC_CI_WORKFLOW_YAML = `# Mission Control CI/CD test workflow
# Triggered by EAS webhook or manual dispatch

name: MC CI Test

on:
  push:
    branches: [main]

jobs:
  build_preview:
    name: CI Test Build (Preview)
    type: build
    params:
      platform: ios
      profile: preview

  maestro_test:
    name: Maestro Smoke Test
    needs: [build_preview]
    type: maestro
    params:
      build_id: \${{ needs.build_preview.outputs.build_id }}
      flow_path: .maestro/smoke-test.yaml
`;

// ---------------------------------------------------------------------------
// Maestro smoke-test flow
// ---------------------------------------------------------------------------
export const MAESTRO_SMOKE_FLOW_YAML = `# Maestro E2E smoke test for Cadence
# Validates that the app launches and renders the home screen with tab bar

appId: com.nativesquare.cadence.preview
---
- launchApp
- waitForAnimationToEnd
- assertVisible: "Today"
- assertVisible: "Profile"
- takeScreenshot: smoke-test-home
`;

// ---------------------------------------------------------------------------
// Scaffolding helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function writeIfMissing(
  filePath: string,
  content: string,
  itemName: string
): ScaffoldItem {
  if (existsSync(filePath)) {
    return { name: itemName, path: filePath, created: false, skipped: true };
  }
  try {
    ensureDir(dirname(filePath));
    writeFileSync(filePath, content, "utf-8");
    return { name: itemName, path: filePath, created: true, skipped: false };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      name: itemName,
      path: filePath,
      created: false,
      skipped: false,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------------
// eas.json channel verification
// ---------------------------------------------------------------------------
export function verifyEasJsonChannels(nativeAppDir: string): ScaffoldItem {
  const easJsonPath = join(nativeAppDir, "eas.json");
  if (!existsSync(easJsonPath)) {
    return {
      name: "eas.json channels",
      path: easJsonPath,
      created: false,
      skipped: false,
      error: "eas.json not found",
    };
  }

  try {
    const content = JSON.parse(readFileSync(easJsonPath, "utf-8"));
    const build = content.build ?? {};
    const hasPreview = !!build.preview?.channel;
    const hasProduction = !!build.production?.channel;

    if (hasPreview && hasProduction) {
      return {
        name: "eas.json channels",
        path: easJsonPath,
        created: false,
        skipped: true,
      };
    }

    // Add missing channels
    if (!hasPreview) {
      build.preview = {
        ...build.preview,
        channel: "preview",
      };
    }
    if (!hasProduction) {
      build.production = {
        ...build.production,
        channel: "production",
      };
    }
    content.build = build;
    writeFileSync(easJsonPath, JSON.stringify(content, null, 2) + "\n", "utf-8");
    return {
      name: "eas.json channels",
      path: easJsonPath,
      created: true,
      skipped: false,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      name: "eas.json channels",
      path: easJsonPath,
      created: false,
      skipped: false,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------------
// Fingerprint runtime policy check
// ---------------------------------------------------------------------------
export function checkFingerprintPolicy(nativeAppDir: string): ScaffoldItem {
  const appConfigPath = join(nativeAppDir, "app.config.ts");
  if (!existsSync(appConfigPath)) {
    return {
      name: "fingerprint policy",
      path: appConfigPath,
      created: false,
      skipped: false,
      error: "app.config.ts not found",
    };
  }

  const content = readFileSync(appConfigPath, "utf-8");
  if (content.includes('policy: "fingerprint"')) {
    return {
      name: "fingerprint policy",
      path: appConfigPath,
      created: false,
      skipped: true,
    };
  }

  // Update policy from appVersion to fingerprint
  if (content.includes('policy: "appVersion"')) {
    const updated = content.replace(
      'policy: "appVersion"',
      'policy: "fingerprint"'
    );
    writeFileSync(appConfigPath, updated, "utf-8");
    return {
      name: "fingerprint policy",
      path: appConfigPath,
      created: true,
      skipped: false,
    };
  }

  return {
    name: "fingerprint policy",
    path: appConfigPath,
    created: false,
    skipped: false,
    error: "runtimeVersion policy not found in app.config.ts",
  };
}

// ---------------------------------------------------------------------------
// Main scaffolding entry point
// ---------------------------------------------------------------------------
export function runScaffolding(nativeAppDir: string): ScaffoldReport {
  const items: ScaffoldItem[] = [];

  // 1. Verify eas.json has preview/production channels
  items.push(verifyEasJsonChannels(nativeAppDir));

  // 2. Ensure fingerprint policy in app.config.ts
  items.push(checkFingerprintPolicy(nativeAppDir));

  // 3. Create EAS workflow
  const workflowPath = join(
    nativeAppDir,
    ".eas",
    "workflows",
    "mc-ci-test.yml"
  );
  items.push(writeIfMissing(workflowPath, MC_CI_WORKFLOW_YAML, "EAS workflow"));

  // 4. Create Maestro smoke test
  const maestroPath = join(nativeAppDir, ".maestro", "smoke-test.yaml");
  items.push(
    writeIfMissing(maestroPath, MAESTRO_SMOKE_FLOW_YAML, "Maestro smoke test")
  );

  // 5. Webhook configuration (documented — requires manual setup)
  items.push({
    name: "EAS webhook",
    path: "N/A — configure via eas webhook:create",
    created: false,
    skipped: true,
  });

  const hasCriticalErrors = items.some(
    (i) => i.error !== undefined && !i.skipped
  );

  return { items, hasCriticalErrors };
}
