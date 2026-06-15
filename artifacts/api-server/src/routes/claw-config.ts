import { Router, type IRouter } from "express";
import { db, clawConfigsTable, clawSubAgentsTable, clawQuickPromptsTable, knowledgeBaseItems } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/workrooms/:workroomId/claw", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const [configs, subAgents, quickPrompts, kbItems] = await Promise.all([
    db.select().from(clawConfigsTable).where(eq(clawConfigsTable.workroomId, workroomId)).limit(1),
    db.select().from(clawSubAgentsTable).where(eq(clawSubAgentsTable.workroomId, workroomId)).orderBy(asc(clawSubAgentsTable.sortOrder)),
    db.select().from(clawQuickPromptsTable).where(eq(clawQuickPromptsTable.workroomId, workroomId)).orderBy(asc(clawQuickPromptsTable.sortOrder)),
    db.select({ id: knowledgeBaseItems.id }).from(knowledgeBaseItems).where(eq(knowledgeBaseItems.workroomId, workroomId)),
  ]);
  res.json({ config: configs[0] ?? null, subAgents, quickPrompts, kbCount: kbItems.length });
});

router.put("/workrooms/:workroomId/claw", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const { name, systemPrompt, model, temperature, maxTokens, chunkSize, chunkOverlap, ragTopK } = req.body as Record<string, string | number>;
  const existing = await db.select({ id: clawConfigsTable.id }).from(clawConfigsTable).where(eq(clawConfigsTable.workroomId, workroomId)).limit(1);
  const vals = {
    name: name as string | undefined,
    systemPrompt: systemPrompt as string | undefined,
    model: model as string | undefined,
    temperature: temperature !== undefined ? parseFloat(String(temperature)) : undefined,
    maxTokens: maxTokens !== undefined ? parseInt(String(maxTokens)) : undefined,
    chunkSize: chunkSize !== undefined ? parseInt(String(chunkSize)) : undefined,
    chunkOverlap: chunkOverlap !== undefined ? parseInt(String(chunkOverlap)) : undefined,
    ragTopK: ragTopK !== undefined ? parseInt(String(ragTopK)) : undefined,
    updatedAt: new Date(),
  };
  if (existing.length > 0) {
    await db.update(clawConfigsTable).set(vals).where(eq(clawConfigsTable.workroomId, workroomId));
  } else {
    await db.insert(clawConfigsTable).values({ workroomId, ...vals });
  }
  res.json({ ok: true });
});

router.put("/workrooms/:workroomId/claw/persona", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const { greeting, isActive } = req.body as { greeting?: string; isActive?: boolean };
  const existing = await db.select({ id: clawConfigsTable.id }).from(clawConfigsTable).where(eq(clawConfigsTable.workroomId, workroomId)).limit(1);
  const vals = { greeting, isActive: isActive !== undefined ? Boolean(isActive) : undefined, updatedAt: new Date() };
  if (existing.length > 0) {
    await db.update(clawConfigsTable).set(vals).where(eq(clawConfigsTable.workroomId, workroomId));
  } else {
    await db.insert(clawConfigsTable).values({ workroomId, greeting: greeting ?? "", isActive: isActive ?? true });
  }
  res.json({ ok: true });
});

router.post("/workrooms/:workroomId/claw/sub-agents", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const { role, agentId, description } = req.body as { role?: string; agentId?: number; description?: string };
  const existing = await db.select({ sortOrder: clawSubAgentsTable.sortOrder }).from(clawSubAgentsTable).where(eq(clawSubAgentsTable.workroomId, workroomId));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map(e => e.sortOrder)) : -1;
  const [inserted] = await db.insert(clawSubAgentsTable).values({
    workroomId,
    role: role ?? "AGENT",
    agentId: agentId ? parseInt(String(agentId)) : undefined,
    description: description ?? "",
    sortOrder: maxOrder + 1,
  }).returning();
  res.json(inserted);
});

router.delete("/workrooms/:workroomId/claw/sub-agents/:subId", async (req, res): Promise<void> => {
  await db.delete(clawSubAgentsTable).where(eq(clawSubAgentsTable.id, parseInt(req.params.subId)));
  res.json({ ok: true });
});

router.post("/workrooms/:workroomId/claw/quick-prompts", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const { label, prompt } = req.body as { label?: string; prompt?: string };
  const existing = await db.select({ sortOrder: clawQuickPromptsTable.sortOrder }).from(clawQuickPromptsTable).where(eq(clawQuickPromptsTable.workroomId, workroomId));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map(e => e.sortOrder)) : -1;
  const [inserted] = await db.insert(clawQuickPromptsTable).values({
    workroomId,
    label: label ?? "Quick Prompt",
    prompt: prompt ?? "",
    sortOrder: maxOrder + 1,
  }).returning();
  res.json(inserted);
});

router.delete("/workrooms/:workroomId/claw/quick-prompts/:promptId", async (req, res): Promise<void> => {
  await db.delete(clawQuickPromptsTable).where(eq(clawQuickPromptsTable.id, parseInt(req.params.promptId)));
  res.json({ ok: true });
});

export default router;
