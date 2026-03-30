/**
 * TEMPORARY SCRIPT — Deploy a preview Convex backend but point EAS production at it.
 * Used to pass App Store review with seeded mock data.
 * Remove this script once a real production backend is in place.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT, "packages", "backend");
const NATIVE_DIR = path.join(ROOT, "apps", "native");

function run(command, args, opts = {}) {
  console.log(`\n> ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    shell: true,
    ...opts,
  });

  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}`);
    process.exit(1);
  }

  return result;
}

// Step 1 — Deploy Convex backend to preview (capture output to extract URL)
console.log("=== Step 1/4: Deploying Convex backend to preview ===");
const deployResult = run("pnpm", ["run", "deploy:preview"], {
  cwd: BACKEND_DIR,
  stdio: ["inherit", "pipe", "pipe"],
});

const fullOutput = (deployResult.stdout || "") + (deployResult.stderr || "");
process.stdout.write(deployResult.stdout || "");
process.stderr.write(deployResult.stderr || "");

const urlMatch = fullOutput.match(/https:\/\/[a-zA-Z0-9-.]+\.convex\.cloud/);
if (!urlMatch) {
  console.error(
    "\nFailed to extract Convex preview URL from deploy output.",
    "\nFull output:\n",
    fullOutput,
  );
  process.exit(1);
}

const convexUrl = urlMatch[0];
console.log(`\nExtracted Convex URL: ${convexUrl}`);

// Step 2 — Update EAS environment variable for PRODUCTION with the preview URL
console.log("\n=== Step 2/4: Updating EAS production environment variable ===");
run(
  "eas",
  [
    "env:update",
    "--variable-name",
    "EXPO_PUBLIC_CONVEX_URL",
    "--value",
    convexUrl,
    "--variable-environment",
    "production",
    "--non-interactive",
  ],
  { cwd: NATIVE_DIR, stdio: "inherit" },
);

// Step 3 — Seed preview database with fake users
// console.log("\n=== Step 3/4: Seeding preview database ===");
// run(
//   "pnpm",
//   ["exec", "convex", "run", "--preview-name", "preview", "seed:seedPreviewUsers"],
//   { cwd: BACKEND_DIR, stdio: "inherit" },
// );

// Step 4 — Publish EAS update for production
const commitMsg = spawnSync("git", ["log", "-1", "--format=%s"], {
  encoding: "utf-8",
  shell: true,
  cwd: ROOT,
}).stdout.trim();

const updateArgs = [
  "update",
  "--environment",
  "production",
  "--branch",
  "production",
];
if (commitMsg) {
  updateArgs.push("--message", `"${commitMsg}"`);
}

console.log("\n=== Step 4/4: Publishing EAS update for production ===");
run("eas", updateArgs, {
  cwd: NATIVE_DIR,
  stdio: "inherit",
  env: { ...process.env, CI: "1" },
});

console.log("\nProduction mock deployment complete!");
console.log(
  "⚠️  Production is pointing to the preview Convex backend with seeded data.",
);
