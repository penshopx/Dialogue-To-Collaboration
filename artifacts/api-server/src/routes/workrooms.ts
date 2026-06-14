import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import {
  db,
  workroomsTable,
  workflowTemplatesTable,
  workroomStagesTable,
  workroomTasksTable,
  activityLogsTable,
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
