import { Router, type IRouter } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import {
  db,
  workroomsTable,
  workflowTemplatesTable,
  workroomStagesTable,
  workroomTasksTable,
} from "@workspace/db";

const router: IRouter = Router();

const STAGE_ORDER: Record<string, number> = {
  Intake: 1, Framing: 2, "Skeptic Gate": 3,
  Blueprint: 4, Delivery: 5, "QA Gate": 6, Release: 7, Retro: 8,
};

router.get("/insights", async (_req, res): Promise<void> => {
  // 1. Tasks by role — count each status per assignee_role
  const taskRoleRows = await db
    .select({
      role: workroomTasksTable.assigneeRole,
      status: workroomTasksTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(workroomTasksTable)
    .where(sql`${workroomTasksTable.assigneeRole} is not null`)
    .groupBy(workroomTasksTable.assigneeRole, workroomTasksTable.status);

  const roleMap: Record<string, { role: string; total: number; done: number; doing: number; todo: number }> = {};
  for (const row of taskRoleRows) {
    const r = row.role ?? "unknown";
    if (!roleMap[r]) roleMap[r] = { role: r, total: 0, done: 0, doing: 0, todo: 0 };
    roleMap[r].total += row.count;
    if (row.status === "done") roleMap[r].done += row.count;
    else if (row.status === "doing") roleMap[r].doing += row.count;
    else if (row.status === "todo") roleMap[r].todo += row.count;
  }
  const tasksByRole = Object.values(roleMap).sort((a, b) => b.total - a.total);

  // 2. Stage completion funnel — count each status per stage name
  const stageRows = await db
    .select({
      name: workroomStagesTable.name,
      order: workroomStagesTable.order,
      status: workroomStagesTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(workroomStagesTable)
    .groupBy(workroomStagesTable.name, workroomStagesTable.order, workroomStagesTable.status);

  const stageMap: Record<string, { stageName: string; order: number; completed: number; active: number; pending: number; awaitingGate: number }> = {};
  for (const row of stageRows) {
    if (!stageMap[row.name]) {
      stageMap[row.name] = {
        stageName: row.name,
        order: STAGE_ORDER[row.name] ?? row.order,
        completed: 0, active: 0, pending: 0, awaitingGate: 0,
      };
    }
    if (row.status === "completed" || row.status === "approved") stageMap[row.name].completed += row.count;
    else if (row.status === "active") stageMap[row.name].active += row.count;
    else if (row.status === "pending") stageMap[row.name].pending += row.count;
    else if (row.status === "awaiting_gate") stageMap[row.name].awaitingGate += row.count;
  }
  const stageCompletionFunnel = Object.values(stageMap).sort((a, b) => a.order - b.order);

  // 3. Template usage — workroom count and avg progress per template
  const templateRows = await db
    .select({
      templateId: workroomsTable.templateId,
      templateName: workflowTemplatesTable.name,
      sector: workflowTemplatesTable.sector,
      count: sql<number>`count(*)::int`,
      avgProgress: sql<number>`round(avg(${workroomsTable.progress})::numeric, 1)::float`,
    })
    .from(workroomsTable)
    .innerJoin(workflowTemplatesTable, eq(workflowTemplatesTable.id, workroomsTable.templateId))
    .groupBy(workroomsTable.templateId, workflowTemplatesTable.name, workflowTemplatesTable.sector)
    .orderBy(sql`count(*) desc`);

  const templateUsage = templateRows.map((r) => ({
    templateName: r.templateName,
    sector: r.sector,
    workroomCount: r.count,
    avgProgress: r.avgProgress ?? 0,
  }));

  // 4. Totals
  const [taskTotals] = await db
    .select({
      all: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${workroomTasksTable.status} = 'done')::int`,
    })
    .from(workroomTasksTable);

  const [workroomCounts] = await db
    .select({
      active: sql<number>`count(*) filter (where ${workroomsTable.status} = 'active')::int`,
      completed: sql<number>`count(*) filter (where ${workroomsTable.status} = 'completed')::int`,
    })
    .from(workroomsTable);

  res.json({
    tasksByRole,
    stageCompletionFunnel,
    templateUsage,
    totalTasksDone: taskTotals?.done ?? 0,
    totalTasksAll: taskTotals?.all ?? 0,
    completedWorkrooms: workroomCounts?.completed ?? 0,
    activeWorkrooms: workroomCounts?.active ?? 0,
  });
});

export default router;
