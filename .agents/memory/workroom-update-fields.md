---
name: WorkroomUpdate extended fields
description: deadline and kpiTargets added to WorkroomUpdate OpenAPI schema and PATCH route; conversion rules.
---

## Rule
When `UpdateWorkroomBody` includes `deadline` (type: string | null), always convert it to `Date | null` before passing to Drizzle `.set()`.

```typescript
const { deadline, ...rest } = parsed.data;
db.update(workroomsTable).set({
  ...rest,
  ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
})
```

`kpiTargets` is a freeform JSON blob (jsonb column). On the frontend, cast to `unknown as Record<string, unknown>` before passing to the generated mutation hook.

**Why:** Drizzle's DB column is typed as `Date | null`, but the generated Zod schema from OpenAPI produces `string | null`. The two sides need an explicit bridge.

**How to apply:** Any time the PATCH /workrooms/:id route updates deadline.
