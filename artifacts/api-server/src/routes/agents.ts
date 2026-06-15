import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, agentsTable, workroomTasksTable } from "@workspace/db";
import {
  GetAgentParams,
  UpdateAgentParams,
  DeleteAgentParams,
  CreateAgentBody,
  UpdateAgentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/agents", async (_req, res): Promise<void> => {
  const agents = await db.select().from(agentsTable).orderBy(agentsTable.createdAt);
  res.json(agents);
});

router.post("/agents", async (req, res): Promise<void> => {
  const parsed = CreateAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [agent] = await db.insert(agentsTable).values(parsed.data).returning();
  res.status(201).json(agent);
});

router.get("/agents/workload", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      functionRole: workroomTasksTable.functionRole,
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${workroomTasksTable.status} = 'done')::int`,
    })
    .from(workroomTasksTable)
    .groupBy(workroomTasksTable.functionRole);
  res.json(rows);
});

router.get("/agents/:id", async (req, res): Promise<void> => {
  const params = GetAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [agent] = await db
    .select()
    .from(agentsTable)
    .where(eq(agentsTable.id, params.data.id));

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.json(agent);
});

router.patch("/agents/:id", async (req, res): Promise<void> => {
  const params = UpdateAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [agent] = await db
    .update(agentsTable)
    .set(parsed.data)
    .where(eq(agentsTable.id, params.data.id))
    .returning();

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.json(agent);
});

router.delete("/agents/:id", async (req, res): Promise<void> => {
  const params = DeleteAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [agent] = await db
    .delete(agentsTable)
    .where(eq(agentsTable.id, params.data.id))
    .returning();

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
