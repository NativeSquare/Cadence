/**
 * Quick script to test actual Garmin API responses and compare against OpenAPI spec.
 * Usage: npx tsx scripts/test-garmin-response.ts <token>
 */

const TOKEN = process.env.GARMIN_TOKEN || process.argv[2];
if (!TOKEN) {
  console.error("Provide token as GARMIN_TOKEN env var or CLI argument");
  process.exit(1);
}

const BASE = "https://apis.garmin.com/wellness-api/rest";

async function garminFetch(path: string) {
  const url = `${BASE}${path}`;
  console.log(`\n→ GET ${url}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  console.log(`  Status: ${res.status}`);
  if (!res.ok) {
    console.log(`  Error: ${text}`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    console.log(`  Body: ${text.slice(0, 200)}`);
    return null;
  }
}

function printKeys(name: string, obj: Record<string, unknown>) {
  const keys = Object.keys(obj).sort();
  console.log(`\n${name} — ${keys.length} fields:`);
  keys.forEach((k) => {
    const val = obj[k];
    const type =
      val === null
        ? "null"
        : Array.isArray(val)
          ? `array[${val.length}]`
          : typeof val === "object"
            ? `object{${Object.keys(val as object).length} keys}`
            : typeof val;
    console.log(`  ${k}: ${type} = ${JSON.stringify(val)?.slice(0, 80)}`);
  });
}

async function main() {
  // 1. Test basic auth — user id
  console.log("=== Testing token validity ===");
  const userId = await garminFetch("/user/id");
  if (!userId) {
    console.log("\nToken doesn't work for /user/id either. Trying other endpoints...\n");
  } else {
    console.log(`  UserId: ${JSON.stringify(userId)}`);
  }

  // 2. Test user permissions
  console.log("\n=== User Permissions ===");
  await garminFetch("/user/permissions");

  // 3. Try pull endpoints (last 24h)
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 24 * 60 * 60;
  const params = `uploadStartTimeInSeconds=${oneDayAgo}&uploadEndTimeInSeconds=${now}`;

  console.log("\n=== Pull endpoints (last 24h) ===");
  const endpoints = ["dailies", "sleeps", "activities"];

  for (const ep of endpoints) {
    const data = await garminFetch(`/${ep}?${params}`);
    if (data && Array.isArray(data) && data.length > 0) {
      printKeys(ep.toUpperCase(), data[0]);
      const fs = await import("fs");
      fs.writeFileSync(
        `scripts/${ep}-sample.json`,
        JSON.stringify(data[0], null, 2),
      );
      console.log(`  → Saved to scripts/${ep}-sample.json`);
    } else if (data && Array.isArray(data)) {
      console.log(`  ${ep}: empty array`);
    }
  }

  // 4. Try backfill trigger (doesn't return data, just triggers webhook)
  console.log("\n=== Backfill trigger test (dailies, last 24h) ===");
  await garminFetch(`/backfill/dailies?${params}`);
}

main().catch(console.error);
