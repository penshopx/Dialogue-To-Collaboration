import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, workroomBrainTable } from "@workspace/db";
import {
  GetWorkroomBrainParams,
  UpdateWorkroomBrainParams,
  UpdateWorkroomBrainBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workrooms/:workroomId/brain", async (req, res) => {
  const { workroomId } = GetWorkroomBrainParams.parse(req.params);
  const [brain] = await db
    .select()
    .from(workroomBrainTable)
    .where(eq(workroomBrainTable.workroomId, workroomId));
  if (!brain) {
    res.json({ workroomId, context: null, goals: null, constraints: null, stakeholders: null, decisions: null, updatedAt: new Date().toISOString() });
    return;
  }
  res.json({ ...brain, updatedAt: brain.updatedAt.toISOString() });
});

router.patch("/workrooms/:workroomId/brain", async (req, res) => {
  const { workroomId } = UpdateWorkroomBrainParams.parse(req.params);
  const body = UpdateWorkroomBrainBody.parse(req.body);
  const existing = await db.select().from(workroomBrainTable).where(eq(workroomBrainTable.workroomId, workroomId));
  let brain;
  if (existing.length === 0) {
    [brain] = await db.insert(workroomBrainTable).values({ workroomId, ...body, updatedAt: new Date() }).returning();
  } else {
    [brain] = await db.update(workroomBrainTable).set({ ...body, updatedAt: new Date() }).where(eq(workroomBrainTable.workroomId, workroomId)).returning();
  }
  res.json({ ...brain, updatedAt: brain.updatedAt.toISOString() });
});

export default router;
