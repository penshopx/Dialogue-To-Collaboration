import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliverablesTable } from "@workspace/db";
import {
  ListDeliverablesParams,
  CreateDeliverableParams,
  CreateDeliverableBody,
  UpdateDeliverableParams,
  UpdateDeliverableBody,
  DeleteDeliverableParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workrooms/:workroomId/deliverables", async (req, res) => {
  const { workroomId } = ListDeliverablesParams.parse(req.params);
  const items = await db
    .select()
    .from(deliverablesTable)
    .where(eq(deliverablesTable.workroomId, workroomId))
    .orderBy(deliverablesTable.createdAt);
  res.json(items.map(i => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString() })));
});

router.post("/workrooms/:workroomId/deliverables", async (req, res) => {
  const { workroomId } = CreateDeliverableParams.parse(req.params);
  const body = CreateDeliverableBody.parse(req.body);
  const [item] = await db.insert(deliverablesTable).values({ workroomId, ...body }).returning();
  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.patch("/deliverables/:id", async (req, res) => {
  const { id } = UpdateDeliverableParams.parse(req.params);
  const body = UpdateDeliverableBody.parse(req.body);
  const [item] = await db
    .update(deliverablesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(deliverablesTable.id, id))
    .returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.delete("/deliverables/:id", async (req, res) => {
  const { id } = DeleteDeliverableParams.parse(req.params);
  await db.delete(deliverablesTable).where(eq(deliverablesTable.id, id));
  res.status(204).send();
});

export default router;
