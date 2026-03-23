/**
 * EAS CLI prerequisite validation for Story 0.2 (E2E / CI-CD pipeline).
 *
 * Validates:
 *  - eas-cli is installed (`eas --version`)
 *  - user is authenticated (`eas whoami`)
 *  - project is linked (extra.eas.projectId in app.config.ts)
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface EasCheckResult {
  ok: boolean;
  detail: string;
}

export interface EasPrerequisitesReport {
  cliInstalled: EasCheckResult;
  authenticated: EasCheckResult;
  projectLinked: EasCheckResult;
  allPassed: boolean;
}

/** Run a shell command and return stdout (trimmed). Throws on failure. */
function run(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    encoding: "utf-8",
    cwd,
    timeout: 30_000,
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

/** 1.1 — verify eas-cli is installed */
export function checkEasCli(): EasCheckResult {
  try {
    const version = run("eas --version");
    return { ok: true, detail: version };
  } catch {
    return { ok: false, detail: "eas-cli not found" };
  }
}

/** 1.2 — verify eas whoami returns a valid user */
export function checkEasAuth(): EasCheckResult {
  try {
    const whoami = run("eas whoami");
    if (!whoami || whoami.toLowerCase().includes("not logged in")) {
      return { ok: false, detail: "Not authenticated. Set EXPO_TOKEN env var." };
    }
    return { ok: true, detail: whoami.split("\n")[0] };
  } catch {
    return { ok: false, detail: "eas whoami failed. Set EXPO_TOKEN env var." };
  }
}

/** 1.3 — verify EAS project is linked via extra.eas.projectId in app config */
export function checkProjectLinked(nativeAppDir: string): EasCheckResult {
  // Check eas.json exists
  const easJsonPath = join(nativeAppDir, "eas.json");
  if (!existsSync(easJsonPath)) {
    return { ok: false, detail: `eas.json not found at ${easJsonPath}` };
  }

  // Check app.config.ts for projectId reference
  const appConfigPath = join(nativeAppDir, "app.config.ts");
  if (!existsSync(appConfigPath)) {
    return { ok: false, detail: `app.config.ts not found at ${appConfigPath}` };
  }

  const appConfigContent = readFileSync(appConfigPath, "utf-8");
  const projectIdMatch = appConfigContent.match(
    /projectId:\s*["']([a-f0-9-]+)["']/
  );

  if (!projectIdMatch) {
    return {
      ok: false,
      detail: "extra.eas.projectId not found in app.config.ts",
    };
  }

  return {
    ok: true,
    detail: `projectId: ${projectIdMatch[1]}`,
  };
}

/** Run all EAS prerequisite checks */
export function validateEasPrerequisites(
  nativeAppDir: string
): EasPrerequisitesReport {
  const cliInstalled = checkEasCli();
  const authenticated = checkEasAuth();
  const projectLinked = checkProjectLinked(nativeAppDir);

  return {
    cliInstalled,
    authenticated,
    projectLinked,
    allPassed: cliInstalled.ok && authenticated.ok && projectLinked.ok,
  };
}
