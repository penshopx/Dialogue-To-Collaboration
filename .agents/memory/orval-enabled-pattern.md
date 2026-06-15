---
name: Orval query hook enabled pattern
description: How to conditionally enable Orval-generated query hooks without TypeScript errors
---

## Rule
Do NOT pass `{ query: { enabled: boolean } }` to Orval-generated hooks when the hook's `options.query` type is `UseQueryOptions` (not `Partial<UseQueryOptions>`). `UseQueryOptions` requires `queryKey` which is internal to Orval.

## How to apply
Call the hook unconditionally with a safe default (e.g. `id ?? 0`) and guard usage inside `useEffect`:

```tsx
// ✅ Correct
const { data } = useListTemplateStages(state.templateId ?? 0);
useEffect(() => {
  if (!state.templateId || !stages?.length) return;
  // use data safely
}, [stages, state.templateId]);

// ❌ Wrong — TS error: queryKey missing
const { data } = useListTemplateStages(id, { query: { enabled: !!id } });
```

**Why:** Orval codegen emits `options?: { query?: UseQueryOptions<...> }` — not `Partial<UseQueryOptions>` — so the full interface including `queryKey` is required. The hook internally provides `queryKey` via `getListTemplateStagesQueryOptions`.
