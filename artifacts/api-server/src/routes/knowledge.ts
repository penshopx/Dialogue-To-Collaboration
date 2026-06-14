import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, knowledgeBaseItems } from "@workspace/db";
import {
  ListKnowledgeItemsParams,
  CreateKnowledgeItemParams,
  CreateKnowledgeItemBody,
  UpdateKnowledgeItemParams,
  UpdateKnowledgeItemBody,
  DeleteKnowledgeItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workrooms/:workroomId/knowledge", async (req, res) => {
  const { workroomId } = ListKnowledgeItemsParams.parse(req.params);
  const items = await db
    .select()
    .from(knowledgeBaseItems)
    .where(eq(knowledgeBaseItems.workroomId, workroomId))
    .orderBy(knowledgeBaseItems.createdAt);
  res.json(items.map(i => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString() })));
});

router.post("/workrooms/:workroomId/knowledge", async (req, res) => {
  const { workroomId } = CreateKnowledgeItemParams.parse(req.params);
  const body = CreateKnowledgeItemBody.parse(req.body);
  const [item] = await db.insert(knowledgeBaseItems).values({ workroomId, ...body }).returning();
  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.patch("/knowledge/:id", async (req, res) => {
  const { id } = UpdateKnowledgeItemParams.parse(req.params);
  const body = UpdateKnowledgeItemBody.parse(req.body);
  const [item] = await db
    .update(knowledgeBaseItems)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(knowledgeBaseItems.id, id))
    .returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.delete("/knowledge/:id", async (req, res) => {
  const { id } = DeleteKnowledgeItemParams.parse(req.params);
  await db.delete(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id));
  res.status(204).send();
});

export default router;
