import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { resolveAIClient, isProviderConfigured } from "../lib/ai-client.js";
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
  collaborationRolesTable,
  decisionLogsTable,
  templateStagesTable,
  templateRolesTable,
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
      riskLevel: parsed.data.riskLevel ?? "medium",
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      kpiTargets: parsed.data.kpiTargets,
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

  // Fetch inserted stages for seeding
  const insertedStages = await db
    .select()
    .from(workroomStagesTable)
    .where(eq(workroomStagesTable.workroomId, workroom.id))
    .orderBy(workroomStagesTable.order);

  // Seed exit criteria from template stages
  const templateStages = await db
    .select()
    .from(templateStagesTable)
    .where(eq(templateStagesTable.templateId, parsed.data.templateId))
    .orderBy(templateStagesTable.urutan);

  for (const tStage of templateStages) {
    if (tStage.exitCriteria?.trim()) {
      const wsStage = insertedStages.find((s) => s.order === tStage.urutan);
      if (wsStage) {
        const criteriaLines = tStage.exitCriteria.split("\n").map((c) => c.trim()).filter(Boolean);
        if (criteriaLines.length > 0) {
          await db.insert(stageExitCriteriaTable).values(
            criteriaLines.map((criteriaText) => ({
              workroomId: workroom.id,
              stageId: wsStage.id,
              criteriaText,
            }))
          );
        }
      }
    }
  }

  // Seed collaboration roles from template roles
  const templateRoles = await db
    .select()
    .from(templateRolesTable)
    .where(eq(templateRolesTable.templateId, parsed.data.templateId))
    .orderBy(templateRolesTable.urutan);

  if (templateRoles.length > 0) {
    await db.insert(collaborationRolesTable).values(
      templateRoles.map((r) => ({
        workroomId: workroom.id,
        namaPeran: r.namaPeran,
        fungsiPeran: r.fungsiPeran,
        agentId: r.agentId ?? undefined,
        urutan: r.urutan,
      }))
    );
  }

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

  const { deadline, ...rest } = parsed.data;
  const [workroom] = await db
    .update(workroomsTable)
    .set({
      ...rest,
      ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
    })
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

// ── Collaboration Roles ────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/roles", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  if (isNaN(workroomId)) { res.status(400).json({ error: "Invalid workroomId" }); return; }
  const roles = await db.select().from(collaborationRolesTable)
    .where(eq(collaborationRolesTable.workroomId, workroomId))
    .orderBy(collaborationRolesTable.urutan);
  res.json(roles);
});

router.post("/workrooms/:workroomId/roles", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  if (isNaN(workroomId)) { res.status(400).json({ error: "Invalid workroomId" }); return; }
  const { namaPeran, fungsiPeran, agentId, humanPic, isPic, urutan } = req.body as {
    namaPeran?: string; fungsiPeran?: string; agentId?: number;
    humanPic?: string; isPic?: boolean; urutan?: number;
  };
  if (!namaPeran?.trim() || !fungsiPeran?.trim()) {
    res.status(400).json({ error: "namaPeran and fungsiPeran required" }); return;
  }
  const [created] = await db.insert(collaborationRolesTable).values({
    workroomId, namaPeran: namaPeran.trim(), fungsiPeran: fungsiPeran.trim(),
    agentId: agentId ?? null, humanPic: humanPic ?? null,
    isPic: isPic ?? false, urutan: urutan ?? 0,
  }).returning();
  res.status(201).json(created);
});

router.delete("/workrooms/:workroomId/roles/:roleId", async (req, res): Promise<void> => {
  const roleId = parseInt(req.params.roleId);
  if (isNaN(roleId)) { res.status(400).json({ error: "Invalid roleId" }); return; }
  await db.delete(collaborationRolesTable).where(eq(collaborationRolesTable.id, roleId));
  res.sendStatus(204);
});

// ── Decision Logs ──────────────────────────────────────────────────────────────

router.get("/workrooms/:workroomId/decision-logs", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  if (isNaN(workroomId)) { res.status(400).json({ error: "Invalid workroomId" }); return; }
  const logs = await db.select().from(decisionLogsTable)
    .where(eq(decisionLogsTable.workroomId, workroomId))
    .orderBy(desc(decisionLogsTable.createdAt));
  res.json(logs);
});

router.post("/workrooms/:workroomId/decision-logs", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  if (isNaN(workroomId)) { res.status(400).json({ error: "Invalid workroomId" }); return; }
  const { stageId, aktor, tipeAksi, ringkasan, detail } = req.body as {
    stageId?: number; aktor?: string; tipeAksi?: string;
    ringkasan?: string; detail?: Record<string, unknown>;
  };
  if (!aktor?.trim() || !tipeAksi?.trim() || !ringkasan?.trim()) {
    res.status(400).json({ error: "aktor, tipeAksi, ringkasan required" }); return;
  }
  const [created] = await db.insert(decisionLogsTable).values({
    workroomId, stageId: stageId ?? null,
    aktor: aktor.trim(), tipeAksi: tipeAksi.trim(),
    ringkasan: ringkasan.trim(), detail: detail ?? null,
  }).returning();
  res.status(201).json(created);
});

// ── Stage Completion (processStageCompletion) ──────────────────────────────────

router.post("/workrooms/:workroomId/stages/:stageId/complete", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  const stageId = parseInt(req.params.stageId);
  if (isNaN(workroomId) || isNaN(stageId)) { res.status(400).json({ error: "Invalid IDs" }); return; }
  const { note, aktor } = req.body as { note?: string; aktor?: string };

  const [stage] = await db.select().from(workroomStagesTable)
    .where(and(eq(workroomStagesTable.workroomId, workroomId), eq(workroomStagesTable.id, stageId)));
  if (!stage) { res.status(404).json({ error: "Stage not found" }); return; }

  const isGate = stage.stageType === "gate";

  await db.update(workroomStagesTable)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(workroomStagesTable.id, stageId));

  const allStages = await db.select().from(workroomStagesTable)
    .where(eq(workroomStagesTable.workroomId, workroomId))
    .orderBy(workroomStagesTable.order);

  const nextStage = allStages.find(s => s.order === stage.order + 1);

  if (nextStage) {
    await db.update(workroomStagesTable)
      .set({ status: "active" })
      .where(eq(workroomStagesTable.id, nextStage.id));
    await db.update(workroomsTable)
      .set({ currentStageName: nextStage.name, updatedAt: new Date() })
      .where(eq(workroomsTable.id, workroomId));
  } else {
    await db.update(workroomsTable)
      .set({ status: "completed", progress: 100, updatedAt: new Date() })
      .where(eq(workroomsTable.id, workroomId));
  }

  const completedCount = allStages.filter(s => s.status === "completed").length + 1;
  const progress = Math.round((completedCount / allStages.length) * 100);
  await db.update(workroomsTable).set({ progress }).where(eq(workroomsTable.id, workroomId));

  await db.insert(decisionLogsTable).values({
    workroomId, stageId,
    aktor: aktor ?? "System",
    tipeAksi: isGate ? "keputusan_gate" : "stage_complete",
    ringkasan: note ?? `Stage "${stage.name}" selesai`,
  });

  await db.insert(activityLogsTable).values({
    workroomId,
    actor: aktor ?? "System",
    eventType: isGate ? "gate_approved" : "stage_completed",
    description: note ?? `Stage "${stage.name}" marked complete`,
  });

  const [updatedWorkroom] = await db.select().from(workroomsTable).where(eq(workroomsTable.id, workroomId));

  res.json({
    completedStageId: stageId,
    nextStageId: nextStage?.id ?? null,
    isGate,
    workroomStatus: updatedWorkroom?.status ?? "active",
    message: nextStage ? `Lanjut ke "${nextStage.name}"` : "Workroom selesai!",
  });
});

// ── Pack Compiler ──────────────────────────────────────────────────────────────

router.post("/workrooms/:workroomId/compile-pack", async (req, res): Promise<void> => {
  const workroomId = parseInt(req.params.workroomId);
  if (isNaN(workroomId)) { res.status(400).json({ error: "Invalid workroomId" }); return; }

  const deliverables = await db.select().from(deliverablesTable)
    .where(eq(deliverablesTable.workroomId, workroomId));

  const approvedCount = deliverables.filter(d => d.status === "approved" || d.status === "final").length;
  const totalCount = deliverables.length;

  const [packEntry] = await db.insert(decisionLogsTable).values({
    workroomId,
    aktor: "Pack Compiler",
    tipeAksi: "rilis",
    ringkasan: `Pack dikompilasi: ${approvedCount} dari ${totalCount} deliverable dimasukkan`,
    detail: {
      approvedCount,
      totalCount,
      compiledAt: new Date().toISOString(),
      deliverableIds: deliverables.filter(d => d.status === "approved" || d.status === "final").map(d => d.id),
    },
  }).returning();

  res.json({
    workroomId,
    deliverableCount: approvedCount,
    packId: packEntry?.id ?? 0,
    message: `${approvedCount} deliverable dikompilasi ke dalam Final Pack`,
  });
});

// ── Dashboard Early Warnings ───────────────────────────────────────────────────

router.get("/dashboard/early-warnings", async (_req, res): Promise<void> => {
  const warnings: Array<{
    workroomId: number; workroomName: string; stageId: number | null;
    stageName: string | null; warningType: string; message: string;
    severity: string; hoursElapsed: number | null;
  }> = [];

  const activeWorkrooms = await db.select().from(workroomsTable)
    .where(eq(workroomsTable.status, "active"));

  for (const workroom of activeWorkrooms) {
    const stages = await db.select().from(workroomStagesTable)
      .where(eq(workroomStagesTable.workroomId, workroom.id));

    const activeGate = stages.find(s => s.status === "awaiting_gate" || (s.stageType === "gate" && s.status === "active"));
    if (activeGate) {
      const hoursElapsed = (Date.now() - new Date(activeGate.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 24) {
        warnings.push({
          workroomId: workroom.id,
          workroomName: workroom.name,
          stageId: activeGate.id,
          stageName: activeGate.name,
          warningType: "gate_stuck",
          message: `Gate "${activeGate.name}" sudah ${Math.round(hoursElapsed)} jam menunggu keputusan`,
          severity: hoursElapsed > 72 ? "critical" : "warning",
          hoursElapsed: Math.round(hoursElapsed),
        });
      }
    }

    if (workroom.deadline) {
      const hoursToDeadline = (new Date(workroom.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursToDeadline < 48 && hoursToDeadline > 0) {
        warnings.push({
          workroomId: workroom.id,
          workroomName: workroom.name,
          stageId: null,
          stageName: null,
          warningType: "overdue",
          message: `Deadline dalam ${Math.round(hoursToDeadline)} jam — workroom masih di stage "${workroom.currentStageName}"`,
          severity: hoursToDeadline < 24 ? "critical" : "warning",
          hoursElapsed: null,
        });
      }
    }

    const lastActivity = await db.select().from(activityLogsTable)
      .where(eq(activityLogsTable.workroomId, workroom.id))
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(1);

    if (lastActivity.length > 0) {
      const hoursSinceActivity = (Date.now() - new Date(lastActivity[0].createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceActivity > 48) {
        warnings.push({
          workroomId: workroom.id,
          workroomName: workroom.name,
          stageId: null,
          stageName: null,
          warningType: "no_activity",
          message: `Tidak ada aktivitas selama ${Math.round(hoursSinceActivity)} jam`,
          severity: hoursSinceActivity > 96 ? "critical" : "info",
          hoursElapsed: Math.round(hoursSinceActivity),
        });
      }
    }
  }

  warnings.sort((a, b) => {
    const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  res.json(warnings);
});

// ── Dashboard: Recent Decisions ───────────────────────────────────────────────
router.get("/dashboard/recent-decisions", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "8")), 50);

  const rows = await db
    .select({
      id: decisionLogsTable.id,
      workroomId: decisionLogsTable.workroomId,
      workroomName: workroomsTable.name,
      aktor: decisionLogsTable.aktor,
      tipeAksi: decisionLogsTable.tipeAksi,
      ringkasan: decisionLogsTable.ringkasan,
      detail: decisionLogsTable.detail,
      stageId: decisionLogsTable.stageId,
      createdAt: decisionLogsTable.createdAt,
    })
    .from(decisionLogsTable)
    .leftJoin(workroomsTable, eq(decisionLogsTable.workroomId, workroomsTable.id))
    .orderBy(desc(decisionLogsTable.createdAt))
    .limit(limit);

  res.json(rows);
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

/* ── Clone Workroom ─────────────────────────────────────────────────────── */
router.post("/workrooms/:id/clone", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [original] = await db.select().from(workroomsTable).where(eq(workroomsTable.id, id));
  if (!original) { res.status(404).json({ error: "Workroom not found" }); return; }

  const [cloned] = await db.insert(workroomsTable).values({
    name: `${original.name} (Kopi)`,
    templateId: original.templateId,
    objective: original.objective ?? undefined,
    riskLevel: original.riskLevel,
    deadline: original.deadline ?? undefined,
    kpiTargets: original.kpiTargets ?? undefined,
    status: "active",
    currentStageName: "Intake",
    progress: 0,
  }).returning();

  const stagesData = DEFAULT_STAGES.map((s) => ({
    ...s,
    workroomId: cloned.id,
    status: s.order === 1 ? "active" : "pending",
  }));
  await db.insert(workroomStagesTable).values(stagesData);

  await db.insert(activityLogsTable).values({
    workroomId: cloned.id,
    actor: "System",
    eventType: "workroom_created",
    description: `Workroom dikloning dari "${original.name}"`,
  });

  const [template] = await db
    .select({ name: workflowTemplatesTable.name, sector: workflowTemplatesTable.sector })
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, cloned.templateId));

  res.status(201).json({ ...cloned, templateName: template?.name ?? "Unknown", sector: template?.sector ?? "General" });
});

/* ── AI Standup Generator ───────────────────────────────────────────────── */
router.post("/workrooms/:id/standup", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [workroom] = await db.select().from(workroomsTable).where(eq(workroomsTable.id, id));
  if (!workroom) { res.status(404).json({ error: "Workroom not found" }); return; }

  const model = ((req.body as Record<string, unknown>).model as string | undefined) ?? "gpt-4o-mini";
  const { ok, missing } = isProviderConfigured(model);
  if (!ok) {
    res.status(503).json({ error: `Provider belum dikonfigurasi. Env var yang dibutuhkan: ${missing}` });
    return;
  }

  const stages = await db.select().from(workroomStagesTable).where(eq(workroomStagesTable.workroomId, id));
  const allTasks = await db.select().from(workroomTasksTable).where(eq(workroomTasksTable.workroomId, id));
  const recentActivity = await db
    .select().from(activityLogsTable)
    .where(eq(activityLogsTable.workroomId, id))
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(5);

  const activeStage = stages.find((s) => s.status === "active") ?? stages.find((s) => s.status === "awaiting_gate");
  const doneTasks = allTasks.filter((t) => t.status === "done");
  const doingTasks = allTasks.filter((t) => t.status === "doing");
  const blockedTasks = allTasks.filter((t) => t.status === "blocked");
  const todoTasks = allTasks.filter((t) => t.status === "todo");

  const taskList = (arr: typeof doneTasks, max = 4) =>
    arr.length === 0 ? "tidak ada" : arr.slice(0, max).map((t) => `"${t.title}"`).join(", ") + (arr.length > max ? ` (+${arr.length - max} lainnya)` : "");

  const prompt = `Buat laporan standup harian singkat untuk workroom berikut, dalam Bahasa Indonesia.

**Workroom:** ${workroom.name}
**Objektif:** ${workroom.objective ?? "Tidak disebutkan"}
**Stage aktif:** ${activeStage?.name ?? "Belum mulai"} (${activeStage?.status ?? "-"})
**Progress keseluruhan:** ${workroom.progress}%

**Statistik task:**
- Selesai (done): ${doneTasks.length} → ${taskList(doneTasks)}
- Sedang berjalan (doing): ${doingTasks.length} → ${taskList(doingTasks)}
- Blocked: ${blockedTasks.length} → ${taskList(blockedTasks)}
- Belum mulai (todo): ${todoTasks.length}

**Aktivitas terakhir:**
${recentActivity.map((a) => `- ${a.actor ?? "System"}: ${a.description ?? ""}`).join("\n") || "- (tidak ada)"}

Tulis laporan standup dalam format markdown dengan bagian:
## ✅ Yang Sudah Selesai
## 🔄 Sedang Dikerjakan
## 🚧 Hambatan & Blocker
## ⏭️ Langkah Selanjutnya
## 📌 Catatan Penting

Singkat, padat, dan actionable. Maksimal 300 kata.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const client = resolveAIClient(model);
  const stream = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
    max_tokens: 700,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content ?? "";
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
  res.write("data: [DONE]\n\n");
  res.end();
});
