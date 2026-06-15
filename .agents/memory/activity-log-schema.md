---
name: ActivityLog DB schema field names
description: Correct field names for activityLogsTable inserts; isProviderConfigured return type.
---

## ActivityLog fields
activityLogsTable uses: `workroomId`, `actor`, `eventType`, `description` — NOT `action` or `category`.

```typescript
// CORRECT
await db.insert(activityLogsTable).values({
  workroomId: id,
  actor: "System",
  eventType: "workroom_created",
  description: "Workroom dikloning dari ...",
});
```

## isProviderConfigured
Returns `{ ok: boolean, missing: string }` — `missing` is a **string** (single env var name), NOT `string[]`. Do not call `.join()` on it.

**Why:** The DB schema uses snake_case column names aliased differently from what you might expect. The OpenAPI-facing `action` field does not exist on the table.
