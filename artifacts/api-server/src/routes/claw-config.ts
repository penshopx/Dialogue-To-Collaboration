import { Router, type IRouter } from "express";
import { db, clawConfigsTable, clawSubAgentsTable, clawQuickPromptsTable, knowledgeBaseItems } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { resolveAIClient, isProviderConfigured, MODEL_CATALOG } from "../lib/ai-client.js";

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

router.post("/workrooms/:workroomId/claw/chat", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const { messages } = req.body as { messages: { role: "user" | "assistant"; content: string }[] };

  const [configs, kbItems] = await Promise.all([
    db.select().from(clawConfigsTable).where(eq(clawConfigsTable.workroomId, workroomId)).limit(1),
    db.select({ title: knowledgeBaseItems.title, content: knowledgeBaseItems.content })
      .from(knowledgeBaseItems).where(eq(knowledgeBaseItems.workroomId, workroomId)),
  ]);

  const cfg = configs[0];
  const topK = cfg?.ragTopK ?? 5;
  const kbContext = kbItems.slice(0, topK)
    .map(k => `**${k.title}**\n${k.content.slice(0, 500)}`)
    .join("\n\n");

  const basePrompt = cfg?.systemPrompt?.trim() || "Kamu adalah asisten AI yang membantu di workroom ini. Jawab dengan jelas dan helpfull.";
  const systemContent = basePrompt + (kbContext ? `\n\n## Knowledge Base\n${kbContext}` : "");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const model = cfg?.model ?? "gpt-4o-mini";
    const { ok, missing } = isProviderConfigured(model);
    if (!ok) {
      res.write(`data: ${JSON.stringify({ error: `API key ${missing} belum dikonfigurasi untuk model ${model}` })}\n\n`);
      res.end();
      return;
    }
    const stream = await resolveAIClient(model).chat.completions.create({
      model,
      temperature: cfg?.temperature ?? 0.7,
      max_tokens: cfg?.maxTokens ?? 2000,
      messages: [{ role: "system", content: systemContent }, ...(messages ?? [])],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

export default router;
