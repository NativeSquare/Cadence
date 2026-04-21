# Intelligence OS — Event Type Registry

Events pass through `intelligence.events.ingest` with a normalized envelope:

```ts
{
  userId: Id<"users">,
  source: "chat" | "soma" | "cron" | "system",
  type: string,       // see registry below
  payload: unknown,   // shape per type
  occurredAt: number, // ms epoch
}
```

Adapters (chat API, Soma webhook, cron jobs, system hooks) are responsible for producing events in this shape. The Gateway validates the envelope only — payload correctness is the adapter's contract.

## Registered types

Add a row here before shipping a new adapter. Keep payload shapes minimal — stores hold the full data; events carry only what the Router needs to decide what to do.

| `type` | `source` | `payload` shape | Triggered by |
|--------|----------|-----------------|--------------|
| `chat.user_message` | `chat` | `{ messageId: string, text: string }` | User sends a chat message. |
| `soma.workout_ingested` | `soma` | `{ workoutId: string, summary: string }` | Soma webhook receives a completed workout. |
| `soma.sleep_ingested` | `soma` | `{ sleepId: string, summary: string }` | Soma webhook receives a sleep record. |
| `cron.morning_check` | `cron` | `{}` | Daily morning cron. |
| `system.plan_block_started` | `system` | `{ blockId: string }` | Training plan transitions to a new block. |

Types not yet wired live here too — documenting the contract ahead of the adapter is fine.
