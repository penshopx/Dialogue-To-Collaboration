---
name: Import order in Express routers
description: Imports appended after export default router cause TypeScript/runtime errors
---

## Rule
All `import` statements in Express route files must be at the **top** of the file, before any route registrations and before `export default router`.

## Why
TypeScript (and bundlers) treat `import` as hoisted declarations, but if you append imports after `export default` via shell `cat >>`, the file structure becomes invalid for some bundlers and confuses the TS compiler. The `export default router` must be the **last** statement.

## How to apply
When appending routes to an existing file:
1. Add new table/type imports to the existing `import { ... } from "@workspace/db"` block at the top.
2. Append only route handler code after existing routes.
3. Keep `export default router;` as the very last line.

Pattern for adding to existing import:
```ts
// Before
import { db, workroomsTable, ... } from "@workspace/db";

// After — add to the destructure, do not create a second import
import { db, workroomsTable, ..., newTable } from "@workspace/db";
```
