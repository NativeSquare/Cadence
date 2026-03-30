# @nativesquare/soma

A [Convex component](https://convex.dev/components) that normalizes health and
fitness data from multiple wearable providers into a single, consistent schema.

Soma gives you a provider-agnostic data store for activities, sleep, body
metrics, daily summaries, nutrition, menstruation, and athlete profiles — all
stored as reactive Convex documents with automatic deduplication. You handle
authentication and data fetching from each provider; Soma handles storage,
normalization, and querying.

## Installation

```bash
npm install @nativesquare/soma
```

## Quick Start

### 1. Register the component

Create (or update) your `convex/convex.config.ts`:

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import soma from "@nativesquare/soma/convex.config.js";

const app = defineApp();
app.use(soma);

export default app;
```

### 2. Instantiate the client

In any Convex function file, create a `Soma` instance:

```ts
import { Soma } from "@nativesquare/soma";
import { components } from "./_generated/api";

const soma = new Soma(components.soma);
```

### 3. Connect a user to a provider

After your app completes the provider's OAuth flow, register the connection:

```ts
import { Soma } from "@nativesquare/soma";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

const soma = new Soma(components.soma);

export const connectProvider = mutation({
  args: { userId: v.string(), provider: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await soma.connect(ctx, {
      userId: args.userId,
      provider: args.provider, // "GARMIN", "FITBIT", "OURA", etc.
    });
  },
});
```

### 4. Ingest health data

Use the ingestion methods to store normalized data. Soma automatically
deduplicates — re-ingesting the same record updates it rather than creating a
duplicate.

```ts
export const ingestWorkout = mutation({
  args: { connectionId: v.string(), userId: v.string(), data: v.any() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await soma.ingestActivity(ctx, {
      connectionId: args.connectionId,
      userId: args.userId,
      ...args.data,
    });
  },
});
```

## Connection Management

Connections link a user in your app to a wearable provider. Each connection is
uniquely identified by a `userId + provider` pair.

### Connect

```ts
const connectionId = await soma.connect(ctx, {
  userId: "user_123",
  provider: "GARMIN",
});
```

Creates the connection if it doesn't exist, or re-activates it if it was
previously disconnected. Idempotent — calling twice is a no-op.

### Disconnect

```ts
await soma.disconnect(ctx, {
  userId: "user_123",
  provider: "GARMIN",
});
```

Sets the connection to inactive. Does **not** delete any synced data, so
re-connecting later preserves historical records.

### Query connections

```ts
// Get all connections for a user (active and inactive)
const connections = await soma.listConnections(ctx, { userId: "user_123" });

// Check if a specific provider is connected
const garmin = await soma.getConnectionByProvider(ctx, {
  userId: "user_123",
  provider: "GARMIN",
});
const isConnected = garmin?.active === true;

// Get a connection by its document ID
const connection = await soma.getConnection(ctx, { connectionId: "..." });
```

### Update a connection

```ts
await soma.updateConnection(ctx, {
  connectionId: "...",
  active: false,
  lastDataUpdate: new Date().toISOString(),
});
```

### Delete a connection

```ts
await soma.deleteConnection(ctx, { connectionId: "..." });
```

Hard deletes the connection record. Synced health data linked to this connection
is **not** cascade-deleted.

## Data Ingestion

Soma stores health data across seven normalized tables. Each ingestion method
accepts a `connectionId`, `userId`, and the data fields for that type.

All methods except menstruation perform **upsert** — if a matching record already
exists, it is updated rather than duplicated.

| Method                | Table           | Dedup Key                                              |
| --------------------- | --------------- | ------------------------------------------------------ |
| `ingestActivity`      | `activities`    | `connectionId` + `metadata.summary_id`                 |
| `ingestSleep`         | `sleep`         | `connectionId` + `metadata.summary_id`                 |
| `ingestBody`          | `body`          | `connectionId` + `metadata.start_time` + `end_time`    |
| `ingestDaily`         | `daily`         | `connectionId` + `metadata.start_time` + `end_time`    |
| `ingestNutrition`     | `nutrition`     | `connectionId` + `metadata.start_time` + `end_time`    |
| `ingestMenstruation`  | `menstruation`  | _(append-only — no dedup)_                             |
| `ingestAthlete`       | `athletes`      | `connectionId` _(one per connection)_                  |

### Example: ingesting from Apple HealthKit

Soma ships HealthKit transformers that convert native HealthKit objects into
Soma's normalized schema:

```ts
import { transformWorkout } from "@nativesquare/soma/healthkit";

// In your React Native app — after reading a workout from HealthKit:
const data = transformWorkout(hkWorkout);

// Then send `data` to your Convex mutation:
const activityId = await soma.ingestActivity(ctx, {
  connectionId,
  userId,
  ...data,
});
```

Available transformers from `@nativesquare/soma/healthkit`:

| Transformer                  | Input               | Output         |
| ---------------------------- | ------------------- | -------------- |
| `transformWorkout`           | `HKWorkout`         | Activity data  |
| `transformSleep`             | `HKCategorySample`  | Sleep data     |
| `transformBody`              | `HKQuantitySample`  | Body data      |
| `transformDaily`             | `HKQuantitySample`  | Daily data     |
| `transformDailyFromSummary`  | `HKActivitySummary` | Daily data     |
| `transformNutrition`         | `HKQuantitySample`  | Nutrition data |
| `transformMenstruation`      | `HKCategorySample`  | Menstruation   |
| `transformAthlete`           | `HKCharacteristics` | Athlete data   |

Also exports enum mapping utilities: `mapActivityType`, `mapSleepLevel`,
`isAsleepCategory`, and `mapMenstruationFlow`.

## Strava Integration

Soma includes a built-in Strava integration that handles the full OAuth
lifecycle — authorization URL generation, token exchange, secure token storage,
automatic token refresh, and data syncing. No manual API calls or token
management required.

There are two ways to use the Strava integration:

- **Managed** — use `soma.connectStrava()`, `soma.syncStrava()`, and
  `soma.disconnectStrava()` which handle everything end-to-end including OAuth
  token storage inside the component.
- **Manual** — use the `StravaClient`, `syncActivities`, and `syncAthlete`
  utilities from `@nativesquare/soma/strava` for full control over the flow
  (e.g., custom token storage, webhook-driven sync).

### Prerequisites

1. **Create a Strava API Application** at
   [strava.com/settings/api](https://www.strava.com/settings/api) to obtain your
   Client ID and Client Secret.

2. **Set environment variables** in the
   [Convex dashboard](https://dashboard.convex.dev):

   | Variable              | Required | Description                                   |
   | --------------------- | -------- | --------------------------------------------- |
   | `STRAVA_CLIENT_ID`    | Yes      | Your Strava application's Client ID           |
   | `STRAVA_CLIENT_SECRET`| Yes      | Your Strava application's Client Secret       |
   | `STRAVA_BASE_URL`     | No       | Override for testing with a mock server        |

   Alternatively, pass credentials directly to the `Soma` constructor:

   ```ts
   const soma = new Soma(components.soma, {
     strava: {
       clientId: "your-client-id",
       clientSecret: "your-client-secret",
     },
   });
   ```

### Managed flow (recommended)

The managed flow handles OAuth, token storage, and syncing in a single call.

#### Step 1: Generate the authorization URL

```ts
import { Soma } from "@nativesquare/soma";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { v } from "convex/values";

const soma = new Soma(components.soma);

export const getStravaAuthUrl = query({
  args: { redirectUri: v.string() },
  handler: async (_ctx, { redirectUri }) => {
    return soma.getStravaAuthUrl({ redirectUri });
  },
});
```

Redirect the user to this URL. After they authorize, Strava redirects back to
your `redirectUri` with a `code` query parameter.

#### Step 2: Handle the OAuth callback

```ts
import { action } from "./_generated/server";

export const handleStravaCallback = action({
  args: { userId: v.string(), code: v.string() },
  handler: async (ctx, { userId, code }) => {
    // Exchanges the code, stores tokens, syncs athlete + activities
    return await soma.connectStrava(ctx, { userId, code });
  },
});
```

`connectStrava` returns `{ connectionId, synced, errors }` — the number of
activities synced and any per-activity errors.

#### Step 3: Incremental sync

```ts
export const syncStravaActivities = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Auto-refreshes token if expired, then syncs
    return await soma.syncStrava(ctx, { userId, includeStreams: true });
  },
});
```

Pass `after` (Unix epoch seconds) to only sync activities after a given
timestamp, useful for incremental updates.

#### Step 4: Disconnect

```ts
export const disconnectStrava = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Revokes token at Strava, deletes stored tokens, sets connection inactive
    await soma.disconnectStrava(ctx, { userId });
  },
});
```

#### Step 5: Query Strava data

Once connected and synced, use the standard Soma query methods — Strava data is
stored in the same normalized tables as any other provider:

```ts
export const getStravaConnection = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await soma.getConnectionByProvider(ctx, {
      userId,
      provider: "STRAVA",
    });
  },
});

export const listStravaActivities = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await soma.listActivities(ctx, { userId, order: "desc" });
  },
});

export const getStravaAthlete = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const athletes = await soma.listAthletes(ctx, { userId });
    return athletes[0] ?? null;
  },
});
```

### Manual flow (advanced)

For full control over the OAuth flow, token storage, and sync timing, use the
low-level utilities from `@nativesquare/soma/strava`. This is useful when you
want to manage tokens yourself, use webhooks for sync triggers, or integrate
with a custom auth system.

```ts
import { Soma } from "@nativesquare/soma";
import {
  StravaClient,
  syncActivities,
  syncAthlete,
} from "@nativesquare/soma/strava";
import { components } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const soma = new Soma(components.soma);

export const syncStrava = internalAction({
  args: {
    userId: v.string(),
    connectionId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, { userId, connectionId, accessToken }) => {
    const client = new StravaClient({ accessToken });

    // Sync the athlete profile
    await syncAthlete({ client, soma, ctx, connectionId, userId });

    // Sync activities (with streams and lap data)
    const result = await syncActivities({
      client,
      soma,
      ctx,
      connectionId,
      userId,
      includeStreams: true,
      includeLaps: true,
    });

    // Update the connection timestamp
    await soma.updateConnection(ctx, {
      connectionId,
      lastDataUpdate: new Date().toISOString(),
    });

    return result; // { synced: number, errors: [...] }
  },
});
```

You can also use the transformers and client independently:

```ts
import {
  StravaClient,
  transformActivity,
  transformAthlete,
  buildAuthUrl,
  exchangeCode,
  refreshToken,
} from "@nativesquare/soma/strava";
```

### Available Strava exports (`@nativesquare/soma/strava`)

| Export               | Type        | Description                                      |
| -------------------- | ----------- | ------------------------------------------------ |
| `StravaClient`       | Class       | Typed Strava API client (uses global `fetch`)    |
| `StravaApiError`     | Class       | Error thrown for non-OK Strava API responses     |
| `syncActivities`     | Function    | Sync activities from Strava into Soma            |
| `syncAthlete`        | Function    | Sync athlete profile from Strava into Soma       |
| `transformActivity`  | Function    | Transform Strava activity → Soma schema          |
| `transformAthlete`   | Function    | Transform Strava athlete → Soma schema           |
| `mapSportType`       | Function    | Map Strava sport type → Soma activity type enum  |
| `buildAuthUrl`       | Function    | Build the OAuth authorization URL                |
| `exchangeCode`       | Function    | Exchange OAuth code for tokens                   |
| `refreshToken`       | Function    | Refresh an expired access token                  |

## Data Queries

Soma provides query methods for reading back health data with optional
time-range filtering. Each data table exposes two query variants:

- **`list{Table}`** — returns all matching records (with optional `limit`)
- **`paginate{Table}`** — cursor-based pagination for large result sets

### Filtering by time range

All queries require a `userId`. Most tables also accept optional `startTime` and
`endTime` arguments (ISO-8601 strings) to filter on `metadata.start_time`:

```ts
// All activities for a user (newest first by default):
const all = await soma.listActivities(ctx, { userId: "user_123" });

// Last 7 days:
const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
const recentActivities = await soma.listActivities(ctx, {
  userId: "user_123",
  startTime: sevenDaysAgo,
});

// Last 28 days of sleep data:
const twentyEightDaysAgo = new Date(Date.now() - 28 * 86_400_000).toISOString();
const sleepHistory = await soma.listSleep(ctx, {
  userId: "user_123",
  startTime: twentyEightDaysAgo,
});

// Custom date range:
const dailySummaries = await soma.listDaily(ctx, {
  userId: "user_123",
  startTime: "2025-01-01T00:00:00.000Z",
  endTime: "2025-01-31T23:59:59.999Z",
  order: "asc", // oldest first
});

// Limit results:
const lastFiveWorkouts = await soma.listActivities(ctx, {
  userId: "user_123",
  limit: 5,
});
```

### Pagination

For large datasets or infinite-scroll UIs, use the paginated variants with
Convex's `paginationOpts`:

```ts
const page = await soma.paginateActivities(ctx, {
  userId: "user_123",
  startTime: sevenDaysAgo,
  paginationOpts: { numItems: 10, cursor: null }, // null = first page
});

// page.page          — array of activity documents
// page.isDone        — true if no more results
// page.continueCursor — pass as cursor to load the next page
```

### Available query methods

| Method                   | Table          | Time-range filter | Notes                      |
| ------------------------ | -------------- | ----------------- | -------------------------- |
| `listActivities`         | `activities`   | Yes               |                            |
| `paginateActivities`     | `activities`   | Yes               |                            |
| `listSleep`              | `sleep`        | Yes               |                            |
| `paginateSleep`          | `sleep`        | Yes               |                            |
| `listBody`               | `body`         | Yes               |                            |
| `paginateBody`           | `body`         | Yes               |                            |
| `listDaily`              | `daily`        | Yes               |                            |
| `paginateDaily`          | `daily`        | Yes               |                            |
| `listNutrition`          | `nutrition`    | Yes               |                            |
| `paginateNutrition`      | `nutrition`    | Yes               |                            |
| `listMenstruation`       | `menstruation` | Yes               |                            |
| `paginateMenstruation`   | `menstruation` | Yes               |                            |
| `listAthletes`           | `athletes`     | No                | One per connection         |
| `getAthlete`             | `athletes`     | No                | By connectionId            |

## Schema

Soma uses [Terra](https://docs.tryterra.co)'s data model as its schema standard,
but has **no runtime dependency on Terra** — data can come from any source as
long as it conforms to the validators.

### Tables

| Table            | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `connections`    | User ↔ provider links                                  |
| `athletes`       | User profile data from providers                        |
| `activities`     | Workouts and exercise sessions                          |
| `body`           | Body metrics (heart rate, blood pressure, etc.)          |
| `daily`          | Daily activity summaries (steps, calories)              |
| `sleep`          | Sleep session data                                      |
| `menstruation`   | Menstruation and fertility data                         |
| `nutrition`      | Food, drink, macro/micronutrient data                   |
| `plannedWorkouts`| Scheduled/planned workouts                              |
| `providerTokens` | OAuth tokens for cloud-based providers (Strava, etc.)  |

All data fields are optional (`v.optional`) unless explicitly required. This
accommodates providers that support different subsets of health data.

## API Reference

### Connection Methods

| Method                                               | Context  | Description                                   |
| ---------------------------------------------------- | -------- | --------------------------------------------- |
| `connect(ctx, { userId, provider })`                 | Mutation | Connect user to provider (idempotent)         |
| `disconnect(ctx, { userId, provider })`              | Mutation | Disconnect user (soft — preserves data)       |
| `getConnection(ctx, { connectionId })`               | Query    | Get connection by document ID                 |
| `getConnectionByProvider(ctx, { userId, provider })` | Query    | Get connection for a user–provider pair       |
| `listConnections(ctx, { userId })`                   | Query    | List all connections for a user               |
| `updateConnection(ctx, { connectionId, ... })`       | Mutation | Update connection fields                      |
| `deleteConnection(ctx, { connectionId })`            | Mutation | Hard-delete connection record                 |

### Ingestion Methods

| Method                                         | Context  | Description                     |
| ---------------------------------------------- | -------- | ------------------------------- |
| `ingestActivity(ctx, { connectionId, ... })`   | Mutation | Upsert a workout record         |
| `ingestSleep(ctx, { connectionId, ... })`      | Mutation | Upsert a sleep session          |
| `ingestBody(ctx, { connectionId, ... })`       | Mutation | Upsert body metrics             |
| `ingestDaily(ctx, { connectionId, ... })`      | Mutation | Upsert daily activity summary   |
| `ingestNutrition(ctx, { connectionId, ... })`  | Mutation | Upsert nutrition record         |
| `ingestMenstruation(ctx, { connectionId, ... })`| Mutation | Append menstruation record      |
| `ingestAthlete(ctx, { connectionId, ... })`    | Mutation | Upsert athlete profile          |

### Data Query Methods

All `list*` methods accept `{ userId, startTime?, endTime?, order?, limit? }`.
All `paginate*` methods accept `{ userId, startTime?, endTime?, paginationOpts }`.

| Method                                                     | Context | Description                             |
| ---------------------------------------------------------- | ------- | --------------------------------------- |
| `listActivities(ctx, { userId, ... })`                     | Query   | List activities with time-range filter  |
| `paginateActivities(ctx, { userId, ..., paginationOpts })` | Query   | Paginate activities                     |
| `listSleep(ctx, { userId, ... })`                          | Query   | List sleep records                      |
| `paginateSleep(ctx, { userId, ..., paginationOpts })`      | Query   | Paginate sleep records                  |
| `listBody(ctx, { userId, ... })`                           | Query   | List body metrics                       |
| `paginateBody(ctx, { userId, ..., paginationOpts })`       | Query   | Paginate body metrics                   |
| `listDaily(ctx, { userId, ... })`                          | Query   | List daily summaries                    |
| `paginateDaily(ctx, { userId, ..., paginationOpts })`      | Query   | Paginate daily summaries                |
| `listNutrition(ctx, { userId, ... })`                      | Query   | List nutrition records                  |
| `paginateNutrition(ctx, { userId, ..., paginationOpts })`  | Query   | Paginate nutrition records              |
| `listMenstruation(ctx, { userId, ... })`                   | Query   | List menstruation records               |
| `paginateMenstruation(ctx, { userId, ..., paginationOpts })`| Query  | Paginate menstruation records           |
| `listAthletes(ctx, { userId })`                            | Query   | List athlete profiles for a user        |
| `getAthlete(ctx, { connectionId })`                        | Query   | Get athlete profile for a connection    |

### Strava Methods

These methods require Strava credentials to be configured (via environment
variables or the `Soma` constructor). They handle OAuth, token storage, and data
syncing end-to-end.

| Method                                                              | Context | Description                                          |
| ------------------------------------------------------------------- | ------- | ---------------------------------------------------- |
| `getStravaAuthUrl({ redirectUri, scope?, state? })`                 | Pure    | Build the Strava OAuth authorization URL             |
| `connectStrava(ctx, { userId, code, includeStreams? })`             | Action  | Handle OAuth callback: exchange code, store tokens, sync all data |
| `syncStrava(ctx, { userId, includeStreams?, after? })`              | Action  | Incremental sync with auto token refresh             |
| `disconnectStrava(ctx, { userId })`                                 | Action  | Revoke token, delete stored tokens, deactivate connection |

## Direct Component Access

For advanced use cases, you can call component functions directly instead of
using the `Soma` class:

```ts
import { query, mutation } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

// Query — use ctx.runQuery
export const listConnections = query({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.soma.public.listConnections, args);
  },
});

// Mutation — use ctx.runMutation
export const connect = mutation({
  args: { userId: v.string(), provider: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.soma.public.connect, args);
  },
});
```

All public functions are available under `components.soma.public.*`. Strava
actions are under `components.soma.strava.*`. Use `ctx.runQuery` for queries,
`ctx.runMutation` for mutations, and `ctx.runAction` for actions.

## Exports

| Import Path                      | Contents                                                      |
| -------------------------------- | ------------------------------------------------------------- |
| `@nativesquare/soma`             | `Soma` client class                                           |
| `@nativesquare/soma/healthkit`   | Apple HealthKit → Soma transformers & types                   |
| `@nativesquare/soma/strava`      | Strava API client, transformers, OAuth helpers, sync utilities |
| `@nativesquare/soma/react`       | React hooks (coming soon)                                     |
| `@nativesquare/soma/convex.config.js` | Component config for `convex.config.ts`                  |

## License

[Apache-2.0](./LICENSE)
