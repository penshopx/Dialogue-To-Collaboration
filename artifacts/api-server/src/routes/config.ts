import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, workroomConfigTable } from "@workspace/db";
import {
  GetWorkroomConfigParams,
  UpdateWorkroomConfigParams,
  UpdateWorkroomConfigBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workrooms/:workroomId/config", async (req, res) => {
  const { workroomId } = GetWorkroomConfigParams.parse(req.params);
  const [config] = await db.select().from(workroomConfigTable).where(eq(workroomConfigTable.workroomId, workroomId));
  if (!config) {
    res.json({ workroomId, personaName: null, personaDesc: null, personaTone: "professional", personaLanguage: "id", personaEmoji: "🤖", policies: null, updatedAt: new Date().toISOString() });
    return;
  }
  res.json({ ...config, updatedAt: config.updatedAt.toISOString() });
});

router.patch("/workrooms/:workroomId/config", async (req, res) => {
  const { workroomId } = UpdateWorkroomConfigParams.parse(req.params);
  const body = UpdateWorkroomConfigBody.parse(req.body);
  const existing = await db.select().from(workroomConfigTable).where(eq(workroomConfigTable.workroomId, workroomId));
  let config;
  if (existing.length === 0) {
    [config] = await db.insert(workroomConfigTable).values({ workroomId, ...body, updatedAt: new Date() }).returning();
  } else {
    [config] = await db.update(workroomConfigTable).set({ ...body, updatedAt: new Date() }).where(eq(workroomConfigTable.workroomId, workroomId)).returning();
  }
  res.json({ ...config, updatedAt: config.updatedAt.toISOString() });
});

export default router;
