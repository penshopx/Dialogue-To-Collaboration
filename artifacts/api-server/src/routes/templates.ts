import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, workflowTemplatesTable, workroomsTable, workroomStagesTable } from "@workspace/db";
import {
  GetTemplateParams,
  UpdateTemplateParams,
  DeleteTemplateParams,
  CreateTemplateBody,
  UpdateTemplateBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/templates", async (req, res): Promise<void> => {
  const templates = await db.select().from(workflowTemplatesTable).orderBy(workflowTemplatesTable.createdAt);

  const result = await Promise.all(
    templates.map(async (t) => {
      const [stageCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(workroomStagesTable)
        .innerJoin(workroomsTable, eq(workroomsTable.id, workroomStagesTable.workroomId))
        .where(eq(workroomsTable.templateId, t.id));

      const [workroomCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(workroomsTable)
        .where(eq(workroomsTable.templateId, t.id));

      return {
        ...t,
        stageCount: stageCountRow?.count ?? 0,
        workroomCount: workroomCountRow?.count ?? 0,
      };
    })
  );

  res.json(result);
});

router.post("/templates", async (req, res): Promise<void> => {
  const parsed = CreateTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [template] = await db
    .insert(workflowTemplatesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({ ...template, stageCount: 0, workroomCount: 0 });
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const [workroomCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workroomsTable)
    .where(eq(workroomsTable.templateId, template.id));

  res.json({ ...template, stageCount: 8, workroomCount: workroomCountRow?.count ?? 0 });
});

router.patch("/templates/:id", async (req, res): Promise<void> => {
  const params = UpdateTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [template] = await db
    .update(workflowTemplatesTable)
    .set(parsed.data)
    .where(eq(workflowTemplatesTable.id, params.data.id))
    .returning();

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({ ...template, stageCount: 8, workroomCount: 0 });
});

router.delete("/templates/:id", async (req, res): Promise<void> => {
  const params = DeleteTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .delete(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, params.data.id))
    .returning();

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
