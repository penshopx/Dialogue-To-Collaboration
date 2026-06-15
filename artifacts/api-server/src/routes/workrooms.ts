import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  db,
  workroomsTable,
  workflowTemplatesTable,
  workroomStagesTable,
  workroomTasksTable,
  activityLogsTable,
  stageSummariesTable,
  workroomMetricsTable,
  knowledgeBaseItems,
  deliverablesTable,
  workroomBrainTable,
  workroomConfigTable,
  stageExitCriteriaTable,
} from "@workspace/db";
import {
  GetWorkroomParams,
  UpdateWorkroomParams,
  DeleteWorkroomParams,
  CreateWorkroomBody,
  UpdateWorkroomBody,
  ListWorkroomStagesParams,
  UpdateWorkroomStageParams,
  UpdateWorkroomStageBody,
  ListWorkroomTasksParams,
  CreateWorkroomTaskParams,
  CreateWorkroomTaskBody,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
  ListWorkroomActivityParams,
  AddWorkroomActivityParams,
  AddWorkroomActivityBody,
  GetStageSummaryParams,
  UpsertStageSummaryParams,
  UpsertStageSummaryBody,
  ListWorkroomMetricsParams,
  UpsertWorkroomMetricsParams,
  UpsertWorkroomMetricsBody,
  ListKnowledgeItemsParams,
  CreateKnowledgeItemParams,
  CreateKnowledgeItemBody,
  UpdateKnowledgeItemParams,
  UpdateKnowledgeItemBody,
  DeleteKnowledgeItemParams,
  ListDeliverablesParams,
  CreateDeliverableParams,
  CreateDeliverableBody,
  UpdateDeliverableParams,
  UpdateDeliverableBody,
  DeleteDeliverableParams,
  GetWorkroomBrainParams,
  UpdateWorkroomBrainParams,
  UpdateWorkroomBrainBody,
  SummarizeWorkroomParams,
  GetWorkroomConfigParams,
  UpdateWorkroomConfigParams,
  UpdateWorkroomConfigBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Default stages for a new workroom
const DEFAULT_STAGES = [
  { order: 1, name: "Intake", stageType: "kerja", operandPattern: "sequential" },
  { order: 2, name: "Framing", stageType: "kerja", operandPattern: "multiclaw" },
  { order: 3, name: "Skeptic Gate", stageType: "gate", operandPattern: "sequential" },
  { order: 4, name: "Blueprint", stageType: "kerja", operandPattern: "multiclaw" },
  { order: 5, name: "Delivery", stageType: "kerja", operandPattern: "multiclaw" },
  { order: 6, name: "QA Gate", stageType: "gate", operandPattern: "sequential" },
  { order: 7, name: "Release", stageType: "kerja", operandPattern: "sequential" },
  { order: 8, name: "Retro", stageType: "kerja", operandPattern: "openclaw" },
];

// ── Workrooms ────────────────────────────────────────────────────────────────

router.get("/workrooms", async (_req, res): Promise<void> => {
  const workrooms = await db
    .select()
    .from(workroomsTable)
    .orderBy(desc(workroomsTable.updatedAt));

  const result = await Promise.all(
    workrooms.map(async (w) => {
      const [template] = await db
        .select({ name: workflowTemplatesTable.name, sector: workflowTemplatesTable.sector })
        .from(workflowTemplatesTable)
        .where(eq(workflowTemplatesTable.id, w.templateId));

      return {
        ...w,
        templateName: template?.name ?? "Unknown",
        sector: template?.sector ?? "General",
      };
    })
  );

  res.json(result);
});

router.post("/workrooms", async (req, res): Promise<void> => {
  const parsed = CreateWorkroomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, parsed.data.templateId));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const [workroom] = await db
    .insert(workroomsTable)
    .values({
      name: parsed.data.name,
      templateId: parsed.data.templateId,
      objective: parsed.data.objective,
      status: "active",
      currentStageName: "Intake",
      progress: 0,
    })
    .returning();

  // Create default stages
  const stagesData = DEFAULT_STAGES.map((s) => ({
    ...s,
    workroomId: workroom.id,
    status: s.order === 1 ? "active" : "pending",
  }));

  await db.insert(workroomStagesTable).values(stagesData);

  // Add activity log
  await db.insert(activityLogsTable).values({
    workroomId: workroom.id,
    eventType: "workroom_created",
    description: `Workroom "${workroom.name}" dibuat dari template "${template.name}"`,
    actor: "System",
  });

  res.status(201).json({
    ...workroom,
    templateName: template.name,
    sector: template.sector,
  });
});

router.get("/workrooms/:id", async (req, res): Promise<void> => {
  const params = GetWorkroomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workroom] = await db
    .select()
    .from(workroomsTable)
    .where(eq(workroomsTable.id, params.data.id));

  if (!workroom) {
    res.status(404).json({ error: "Workroom not found" });
    return;
  }

  const [template] = await db
    .select({ name: workflowTemplatesTable.name, sector: workflowTemplatesTable.sector })
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, workroom.templateId));

  const stages = await db
    .select()
    .from(workroomStagesTable)
    .where(eq(workroomStagesTable.workroomId, params.data.id))
    .orderBy(workroomStagesTable.order);

  const tasks = await db
    .select()
    .from(workroomTasksTable)
    .where(eq(workroomTasksTable.workroomId, params.data.id))
    .orderBy(workroomTasksTable.createdAt);

  res.json({
    ...workroom,
    templateName: template?.name ?? "Unknown",
    sector: template?.sector ?? "General",
    stages,
    tasks,
  });
});

router.patch("/workrooms/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkroomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWorkroomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workroom] = await db
    .update(workroomsTable)
    .set(parsed.data)
    .where(eq(workroomsTable.id, params.data.id))
    .returning();

  if (!workroom) {
    res.status(404).json({ error: "Workroom not found" });
    return;
  }

  const [template] = await db
    .select({ name: workflowTemplatesTable.name, sector: workflowTemplatesTable.sector })
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, workroom.templateId));

  res.json({ ...workroom, templateName: template?.name ?? "Unknown", sector: template?.sector ?? "General" });
});

router.delete("/workrooms/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkroomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(activityLogsTable).where(eq(activityLogsTable.workroomId, params.data.id));
  await db.delete(workroomTasksTable).where(eq(workroomTasksTable.workroomId, params.data.id));
  await db.delete(workroomStagesTable).where(eq(workroomStagesTable.workroomId, params.data.id));

  const [workroom] = await db
    .delete(workroomsTable)
    .where(eq(workroomsTable.id, params.data.id))
    .returning();

  if (!workroom) {
    res.status(404).json({ error: "Workroom not found" });
    return;
  }

  res.sendStatus(204);
});

// ── Stages ───────────────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/stages", async (req, res): Promise<void> => {
  const params = ListWorkroomStagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const stages = await db
    .select()
    .from(workroomStagesTable)
    .where(eq(workroomStagesTable.workroomId, params.data.workroomId))
    .orderBy(workroomStagesTable.order);

  res.json(stages);
});

router.patch("/workrooms/:workroomId/stages/:stageId", async (req, res): Promise<void> => {
  const params = UpdateWorkroomStageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWorkroomStageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed" || parsed.data.status === "approved") {
    updateData.completedAt = new Date();
  }

  const [stage] = await db
    .update(workroomStagesTable)
    .set(updateData)
    .where(eq(workroomStagesTable.id, params.data.stageId))
    .returning();

  if (!stage) {
    res.status(404).json({ error: "Stage not found" });
    return;
  }

  // If stage completed, activate the next stage and update workroom progress
  if (parsed.data.status === "completed" || parsed.data.status === "approved") {
    const allStages = await db
      .select()
      .from(workroomStagesTable)
      .where(eq(workroomStagesTable.workroomId, stage.workroomId))
      .orderBy(workroomStagesTable.order);

    const currentIdx = allStages.findIndex((s) => s.id === stage.id);
    const nextStage = allStages[currentIdx + 1];

    const completedCount = allStages.filter(
      (s) => s.status === "completed" || s.status === "approved"
    ).length + 1;
    const progress = Math.round((completedCount / allStages.length) * 100);

    if (nextStage) {
      await db
        .update(workroomStagesTable)
        .set({ status: nextStage.stageType === "gate" ? "awaiting_gate" : "active" })
        .where(eq(workroomStagesTable.id, nextStage.id));

      await db
        .update(workroomsTable)
        .set({ currentStageName: nextStage.name, progress })
        .where(eq(workroomsTable.id, stage.workroomId));
    } else {
      await db
        .update(workroomsTable)
        .set({ status: "completed", progress: 100 })
        .where(eq(workroomsTable.id, stage.workroomId));
    }

    // Log activity
    await db.insert(activityLogsTable).values({
      workroomId: stage.workroomId,
      eventType: "stage_advanced",
      description: `Tahap "${stage.name}" diselesaikan${nextStage ? `. Lanjut ke: ${nextStage.name}` : ". Workroom selesai."}`,
      actor: "System",
    });
  }

  if (parsed.data.gateDecision === "rejected") {
    await db.insert(activityLogsTable).values({
      workroomId: stage.workroomId,
      eventType: "gate_rejected",
      description: `Gate "${stage.name}" ditolak${parsed.data.gateNote ? `: ${parsed.data.gateNote}` : ""}`,
      actor: "Human Gate",
    });
  }

  res.json(stage);
});

// ── Tasks ────────────────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/tasks", async (req, res): Promise<void> => {
  const params = ListWorkroomTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tasks = await db
    .select()
    .from(workroomTasksTable)
    .where(eq(workroomTasksTable.workroomId, params.data.workroomId))
    .orderBy(workroomTasksTable.createdAt);

  res.json(tasks);
});

router.post("/workrooms/:workroomId/tasks", async (req, res): Promise<void> => {
  const pathParams = CreateWorkroomTaskParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const parsed = CreateWorkroomTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(workroomTasksTable)
    .values({
      ...parsed.data,
      workroomId: pathParams.data.workroomId,
    })
    .returning();

  res.status(201).json(task);
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .update(workroomTasksTable)
    .set(parsed.data)
    .where(eq(workroomTasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(task);
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(workroomTasksTable)
    .where(eq(workroomTasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

// ── Activity Log ─────────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/activity", async (req, res): Promise<void> => {
  const params = ListWorkroomActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db
    .select()
    .from(activityLogsTable)
    .where(eq(activityLogsTable.workroomId, params.data.workroomId))
    .orderBy(desc(activityLogsTable.createdAt));

  res.json(logs);
});

router.post("/workrooms/:workroomId/activity", async (req, res): Promise<void> => {
  const pathParams = AddWorkroomActivityParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const parsed = AddWorkroomActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [log] = await db
    .insert(activityLogsTable)
    .values({
      ...parsed.data,
      workroomId: pathParams.data.workroomId,
    })
    .returning();

  res.status(201).json(log);
});

// ── Stage Summary ─────────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/stages/:stageId/summary", async (req, res): Promise<void> => {
  const params = GetStageSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [summary] = await db
    .select()
    .from(stageSummariesTable)
    .where(and(
      eq(stageSummariesTable.workroomId, params.data.workroomId),
      eq(stageSummariesTable.stageId, params.data.stageId)
    ));

  if (!summary) {
    res.status(404).json({ error: "Summary not found" });
    return;
  }

  res.json(summary);
});

router.put("/workrooms/:workroomId/stages/:stageId/summary", async (req, res): Promise<void> => {
  const params = UpsertStageSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpsertStageSummaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(stageSummariesTable)
    .where(and(
      eq(stageSummariesTable.workroomId, params.data.workroomId),
      eq(stageSummariesTable.stageId, params.data.stageId)
    ));

  let summary;
  if (existing) {
    [summary] = await db
      .update(stageSummariesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(stageSummariesTable.id, existing.id))
      .returning();
  } else {
    [summary] = await db
      .insert(stageSummariesTable)
      .values({
        workroomId: params.data.workroomId,
        stageId: params.data.stageId,
        ...parsed.data,
      })
      .returning();
  }

  res.json(summary);
});

// ── Workroom Metrics ──────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/metrics", async (req, res): Promise<void> => {
  const params = ListWorkroomMetricsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const metrics = await db
    .select()
    .from(workroomMetricsTable)
    .where(eq(workroomMetricsTable.workroomId, params.data.workroomId))
    .orderBy(workroomMetricsTable.stageId);

  res.json(metrics);
});

router.put("/workrooms/:workroomId/metrics", async (req, res): Promise<void> => {
  const params = UpsertWorkroomMetricsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpsertWorkroomMetricsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const stageId = (parsed.data as Record<string, unknown>).stageId as number | undefined;
  if (!stageId) {
    res.status(400).json({ error: "stageId required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(workroomMetricsTable)
    .where(and(
      eq(workroomMetricsTable.workroomId, params.data.workroomId),
      eq(workroomMetricsTable.stageId, stageId)
    ));

  const metricsData = {
    ...parsed.data,
    startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : undefined,
    completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : undefined,
  };

  let metrics;
  if (existing) {
    [metrics] = await db
      .update(workroomMetricsTable)
      .set({ ...metricsData, updatedAt: new Date() })
      .where(eq(workroomMetricsTable.id, existing.id))
      .returning();
  } else {
    [metrics] = await db
      .insert(workroomMetricsTable)
      .values({
        workroomId: params.data.workroomId,
        stageId,
        ...metricsData,
      })
      .returning();
  }

  res.json(metrics);
});

// ── Knowledge Base ────────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/knowledge", async (req, res): Promise<void> => {
  const params = ListKnowledgeItemsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const items = await db.select().from(knowledgeBaseItems)
    .where(eq(knowledgeBaseItems.workroomId, params.data.workroomId))
    .orderBy(desc(knowledgeBaseItems.createdAt));
  res.json(items);
});

router.post("/workrooms/:workroomId/knowledge", async (req, res): Promise<void> => {
  const pathParams = CreateKnowledgeItemParams.safeParse(req.params);
  if (!pathParams.success) { res.status(400).json({ error: pathParams.error.message }); return; }
  const parsed = CreateKnowledgeItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.insert(knowledgeBaseItems)
    .values({ ...parsed.data, workroomId: pathParams.data.workroomId })
    .returning();
  res.status(201).json(item);
});

router.patch("/knowledge/:id", async (req, res): Promise<void> => {
  const params = UpdateKnowledgeItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateKnowledgeItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.update(knowledgeBaseItems).set(parsed.data)
    .where(eq(knowledgeBaseItems.id, params.data.id)).returning();
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  res.json(item);
});

router.delete("/knowledge/:id", async (req, res): Promise<void> => {
  const params = DeleteKnowledgeItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, params.data.id));
  res.sendStatus(204);
});

// ── Deliverables ──────────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/deliverables", async (req, res): Promise<void> => {
  const params = ListDeliverablesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const items = await db.select().from(deliverablesTable)
    .where(eq(deliverablesTable.workroomId, params.data.workroomId))
    .orderBy(desc(deliverablesTable.createdAt));
  res.json(items);
});

router.post("/workrooms/:workroomId/deliverables", async (req, res): Promise<void> => {
  const pathParams = CreateDeliverableParams.safeParse(req.params);
  if (!pathParams.success) { res.status(400).json({ error: pathParams.error.message }); return; }
  const parsed = CreateDeliverableBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.insert(deliverablesTable)
    .values({ ...parsed.data, workroomId: pathParams.data.workroomId })
    .returning();
  res.status(201).json(item);
});

router.patch("/deliverables/:id", async (req, res): Promise<void> => {
  const params = UpdateDeliverableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateDeliverableBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.update(deliverablesTable).set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(deliverablesTable.id, params.data.id)).returning();
  if (!item) { res.status(404).json({ error: "Deliverable not found" }); return; }
  res.json(item);
});

router.delete("/deliverables/:id", async (req, res): Promise<void> => {
  const params = DeleteDeliverableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(deliverablesTable).where(eq(deliverablesTable.id, params.data.id));
  res.sendStatus(204);
});

// ── Project Brain ─────────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/brain", async (req, res): Promise<void> => {
  const params = GetWorkroomBrainParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [brain] = await db.select().from(workroomBrainTable)
    .where(eq(workroomBrainTable.workroomId, params.data.workroomId));
  if (!brain) {
    const [created] = await db.insert(workroomBrainTable)
      .values({ workroomId: params.data.workroomId }).returning();
    res.json(created);
    return;
  }
  res.json(brain);
});

router.patch("/workrooms/:workroomId/brain", async (req, res): Promise<void> => {
  const params = UpdateWorkroomBrainParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateWorkroomBrainBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [existing] = await db.select().from(workroomBrainTable)
    .where(eq(workroomBrainTable.workroomId, params.data.workroomId));
  let brain;
  if (existing) {
    [brain] = await db.update(workroomBrainTable).set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(workroomBrainTable.workroomId, params.data.workroomId)).returning();
  } else {
    [brain] = await db.insert(workroomBrainTable)
      .values({ workroomId: params.data.workroomId, ...parsed.data }).returning();
  }
  res.json(brain);
});

// ── Workroom AI Summary (SSE) ─────────────────────────────────────────────────

router.post("/workrooms/:workroomId/summarize", async (req, res): Promise<void> => {
  const params = SummarizeWorkroomParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [workroom] = await db.select().from(workroomsTable)
    .where(eq(workroomsTable.id, params.data.workroomId));
  if (!workroom) { res.status(404).json({ error: "Workroom not found" }); return; }

  const stages = await db.select().from(workroomStagesTable)
    .where(eq(workroomStagesTable.workroomId, params.data.workroomId))
    .orderBy(workroomStagesTable.order);

  const tasks = await db.select().from(workroomTasksTable)
    .where(eq(workroomTasksTable.workroomId, params.data.workroomId));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stagesSummary = stages.map((s) => `${s.order}. ${s.name} [${s.status}]`).join(", ");
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length;
  const escalated = tasks.filter((t) => t.escalationReason).length;

  const summaryLines = [
    `## Ringkasan Eksekutif: ${workroom.name}\n`,
    `**Tujuan:** ${workroom.objective ?? "Belum ditetapkan"}\n\n`,
    `**Status Pipeline:** ${workroom.currentStageName} (${workroom.progress}% selesai)\n`,
    `**Tahapan:** ${stagesSummary}\n\n`,
    `**Progres Tugas:** ${doneTasks}/${totalTasks} tugas selesai`,
    escalated > 0 ? ` · ${escalated} eskalasi aktif` : "",
    `\n\n`,
    `**Keputusan Utama:**\n`,
    stages.filter((s) => s.gateDecision).map((s) => `- ${s.name}: ${s.gateDecision}${s.gateNote ? ` — ${s.gateNote}` : ""}`).join("\n") || "- Belum ada keputusan gate\n",
    `\n\n**Langkah Berikutnya:** Lanjutkan ke ${workroom.currentStageName} dan selesaikan semua tugas yang pending.\n`,
  ];

  for (const chunk of summaryLines) {
    if (chunk) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      await new Promise((r) => setTimeout(r, 40));
    }
  }
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

// ── Workroom Config ───────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/config", async (req, res): Promise<void> => {
  const params = GetWorkroomConfigParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [config] = await db.select().from(workroomConfigTable)
    .where(eq(workroomConfigTable.workroomId, params.data.workroomId));
  if (!config) {
    const [created] = await db.insert(workroomConfigTable)
      .values({ workroomId: params.data.workroomId }).returning();
    res.json(created);
    return;
  }
  res.json(config);
});

router.patch("/workrooms/:workroomId/config", async (req, res): Promise<void> => {
  const params = UpdateWorkroomConfigParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateWorkroomConfigBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [existing] = await db.select().from(workroomConfigTable)
    .where(eq(workroomConfigTable.workroomId, params.data.workroomId));
  let config;
  if (existing) {
    [config] = await db.update(workroomConfigTable).set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(workroomConfigTable.workroomId, params.data.workroomId)).returning();
  } else {
    [config] = await db.insert(workroomConfigTable)
      .values({ workroomId: params.data.workroomId, ...parsed.data }).returning();
  }
  res.json(config);
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [totalWorkrooms] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workroomsTable);

  const [activeWorkrooms] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workroomsTable)
    .where(eq(workroomsTable.status, "active"));

  const [completedWorkrooms] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workroomsTable)
    .where(eq(workroomsTable.status, "completed"));

  const [totalTemplates] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workflowTemplatesTable);

  // Workrooms by status
  const workroomsByStatusRaw = await db
    .select({ status: workroomsTable.status, count: sql<number>`count(*)::int` })
    .from(workroomsTable)
    .groupBy(workroomsTable.status);

  // Workrooms by sector (via template join)
  const workroomsBySectorRaw = await db
    .select({
      sector: workflowTemplatesTable.sector,
      count: sql<number>`count(*)::int`,
    })
    .from(workroomsTable)
    .innerJoin(workflowTemplatesTable, eq(workflowTemplatesTable.id, workroomsTable.templateId))
    .groupBy(workflowTemplatesTable.sector);

  // Count agents
  const { agentsTable } = await import("@workspace/db");
  const [agentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(agentsTable);

  res.json({
    totalWorkrooms: totalWorkrooms?.count ?? 0,
    activeWorkrooms: activeWorkrooms?.count ?? 0,
    completedWorkrooms: completedWorkrooms?.count ?? 0,
    totalTemplates: totalTemplates?.count ?? 0,
    totalAgents: agentCount?.count ?? 0,
    workroomsByStatus: workroomsByStatusRaw,
    workroomsBySector: workroomsBySectorRaw,
  });
});

router.get("/dashboard/recent-workrooms", async (_req, res): Promise<void> => {
  const workrooms = await db
    .select()
    .from(workroomsTable)
    .orderBy(desc(workroomsTable.updatedAt))
    .limit(6);

  const result = await Promise.all(
    workrooms.map(async (w) => {
      const [template] = await db
        .select({ name: workflowTemplatesTable.name, sector: workflowTemplatesTable.sector })
        .from(workflowTemplatesTable)
        .where(eq(workflowTemplatesTable.id, w.templateId));

      return {
        ...w,
        templateName: template?.name ?? "Unknown",
        sector: template?.sector ?? "General",
      };
    })
  );

  res.json(result);
});

export default router;

// ── Stage Exit Criteria ────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/stages/:stageId/exit-criteria", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const stageId = parseInt(req.params.stageId);
  if (isNaN(workroomId) || isNaN(stageId)) { res.status(400).json({ error: "Invalid IDs" }); return; }
  const criteria = await db.select().from(stageExitCriteriaTable)
    .where(and(eq(stageExitCriteriaTable.workroomId, workroomId), eq(stageExitCriteriaTable.stageId, stageId)))
    .orderBy(stageExitCriteriaTable.createdAt);
  res.json(criteria);
});

router.post("/workrooms/:workroomId/stages/:stageId/exit-criteria", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const stageId = parseInt(req.params.stageId);
  if (isNaN(workroomId) || isNaN(stageId)) { res.status(400).json({ error: "Invalid IDs" }); return; }
  const { criteriaText } = req.body as { criteriaText?: string };
  if (!criteriaText?.trim()) { res.status(400).json({ error: "criteriaText required" }); return; }
  const [created] = await db.insert(stageExitCriteriaTable)
    .values({ workroomId, stageId, criteriaText: criteriaText.trim() }).returning();
  res.status(201).json(created);
});

router.patch("/workrooms/:workroomId/stages/:stageId/exit-criteria/:criteriaId", async (req, res): Promise<void> => {
  const criteriaId = parseInt(req.params.criteriaId);
  if (isNaN(criteriaId)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { isMet, criteriaText, verifiedBy } = req.body as { isMet?: boolean; criteriaText?: string; verifiedBy?: string };
  const [updated] = await db.update(stageExitCriteriaTable)
    .set({
      ...(isMet !== undefined ? { isMet, verifiedAt: isMet ? new Date() : null } : {}),
      ...(criteriaText ? { criteriaText } : {}),
      ...(verifiedBy ? { verifiedBy } : {}),
    })
    .where(eq(stageExitCriteriaTable.id, criteriaId)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/workrooms/:workroomId/stages/:stageId/exit-criteria/:criteriaId", async (req, res): Promise<void> => {
  const criteriaId = parseInt(req.params.criteriaId);
  if (isNaN(criteriaId)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(stageExitCriteriaTable).where(eq(stageExitCriteriaTable.id, criteriaId));
  res.sendStatus(204);
});
