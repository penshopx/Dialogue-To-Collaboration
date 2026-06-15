---
name: Orval codegen duplicate types fix
description: How to prevent TS2308 "already exported" when using Orval Zod output with TypeScript types
---

## Rule
In `orval.config.ts` for the `zod` output, do NOT include `schemas: { path, type }`. This causes Orval to generate both Zod schemas (in `api.ts`) AND TypeScript type files (in a `types/` directory), then auto-generate an `index.ts` that re-exports both — causing TS2308 ambiguity for any name that appears in both.

Use `mode: "single"` and set `target` to a single file like `"generated/api.ts"`.

**Why:** Orval names Zod schemas and TypeScript types identically (e.g. `CompleteStageBody`). When both are exported from the same barrel, TypeScript reports "has already exported a member named X".

**How to apply:** If codegen produces a TS2308 error, check the orval config for a `schemas: { path: "generated/types", type: "typescript" }` key in the Zod output and remove it. Also ensure `lib/api-zod/src/index.ts` only contains `export * from "./generated/api";`.
