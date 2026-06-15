---
name: Claw config direct-fetch pattern
description: When to skip Orval codegen and use direct fetch with TanStack Query for internal config endpoints.
---

## Rule
For internal admin/config endpoints (claw-config, notifications) that are NOT in `lib/api-spec/openapi.yaml`, use direct `fetch()` calls inside a `useQuery` / `useMutation` hook rather than generated hooks from Orval codegen.

**Why:** Adding every minor config endpoint to the OpenAPI spec requires running codegen, which touches generated files in two packages. For small internal config surfaces this overhead is not worth it.

**How to apply:**
- Add the route file at `artifacts/api-server/src/routes/<name>.ts`
- Register with `router.use(...)` in `artifacts/api-server/src/routes/index.ts` (BEFORE `export default router`)
- In the frontend component, define inline TypeScript types and call `useQuery({ queryKey, queryFn: () => fetch(...).then(r=>r.json()) })` and `useMutation({ mutationFn: ... })`
- Restart the API server workflow after adding new route files (they won't be active until rebuilt)

**Counterpoint:** If the endpoint will be used in multiple components or needs Zod validation on the server, add it to the OpenAPI spec and run codegen instead.
