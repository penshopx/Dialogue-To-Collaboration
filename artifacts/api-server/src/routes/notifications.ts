import { Router, type IRouter } from "express";
import { db, workroomsTable, workroomStagesTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notifications", async (_req, res): Promise<void> => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [gatePending, overdue, recentlyDone] = await Promise.all([
    db
      .select({
        workroomId: workroomsTable.id,
        workroomName: workroomsTable.name,
        stageName: workroomStagesTable.name,
        stageId: workroomStagesTable.id,
      })
      .from(workroomStagesTable)
      .innerJoin(workroomsTable, eq(workroomsTable.id, workroomStagesTable.workroomId))
      .where(eq(workroomStagesTable.status, "awaiting_gate")),

    db
      .select({
        id: workroomsTable.id,
        name: workroomsTable.name,
        deadline: workroomsTable.deadline,
        currentStageName: workroomsTable.currentStageName,
      })
      .from(workroomsTable)
      .where(
        sql`${workroomsTable.deadline} is not null
          and cast(${workroomsTable.deadline} as date) < current_date
          and ${workroomsTable.status} != 'completed'`
      ),

    db
      .select({ id: workroomsTable.id, name: workroomsTable.name })
      .from(workroomsTable)
      .where(
        sql`${workroomsTable.status} = 'completed'
          and ${workroomsTable.updatedAt} >= ${yesterday.toISOString()}`
      ),
  ]);

  const notifications = [
    ...gatePending.map((g) => ({
      id: `gate-${g.stageId}`,
      type: "gate_pending",
      title: g.workroomName,
      message: `${g.stageName} menunggu keputusan Anda`,
      href: `/workrooms/${g.workroomId}`,
      urgency: "high",
    })),
    ...overdue.map((o) => ({
      id: `overdue-${o.id}`,
      type: "overdue",
      title: o.name,
      message: `Deadline telah lewat — Stage aktif: ${o.currentStageName ?? "—"}`,
      href: `/workrooms/${o.id}`,
      urgency: "high",
    })),
    ...recentlyDone.map((r) => ({
      id: `done-${r.id}`,
      type: "completed",
      title: r.name,
      message: "Workroom berhasil diselesaikan",
      href: `/workrooms/${r.id}`,
      urgency: "low",
    })),
  ];

  res.json({ notifications, count: notifications.length });
});

export default router;
