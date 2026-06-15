import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workroomsTable = pgTable("workrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateId: integer("template_id").notNull(),
  status: text("status").notNull().default("active"),
  currentStageName: text("current_stage_name").notNull().default("Intake"),
  progress: integer("progress").notNull().default(0),
  objective: text("objective"),
  riskLevel: text("risk_level").notNull().default("medium"),
  humanTouchPoints: integer("human_touch_points").notNull().default(0),
  deadline: timestamp("deadline", { withTimezone: true }),
  kpiTargets: jsonb("kpi_targets"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const workroomStagesTable = pgTable("workroom_stages", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").notNull(),
  order: integer("order").notNull(),
  name: text("name").notNull(),
  stageType: text("stage_type").notNull().default("kerja"),
  operandPattern: text("operand_pattern").notNull().default("sequential"),
  status: text("status").notNull().default("pending"),
  gateDecision: text("gate_decision"),
  gateNote: text("gate_note"),
  gateType: text("gate_type"),
  autoRejectConditions: jsonb("auto_reject_conditions"),
  requiredEvidence: jsonb("required_evidence"),
  picName: text("pic_name"),
  responseDeadlineHours: integer("response_deadline_hours"),
  notes: text("notes"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workroomTasksTable = pgTable("workroom_tasks", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").notNull(),
  stageId: integer("stage_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assigneeRole: text("assignee_role"),
  agentId: integer("agent_id"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("todo"),
  output: text("output"),
  confidenceScore: integer("confidence_score"),
  escalationReason: text("escalation_reason"),
  dependencies: jsonb("dependencies"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").notNull(),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  actor: text("actor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stageSummariesTable = pgTable("stage_summaries", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").notNull(),
  stageId: integer("stage_id").notNull(),
  ringkasanEksekutif: text("ringkasan_eksekutif"),
  keputusanUtama: text("keputusan_utama"),
  asumsiKunci: text("asumsi_kunci"),
  risikoYangDiterima: text("risiko_yang_diterima"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const workroomMetricsTable = pgTable("workroom_metrics", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").notNull(),
  stageId: integer("stage_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  decisionLatencyHours: integer("decision_latency_hours"),
  reworkCount: integer("rework_count").notNull().default(0),
  timeSavedHours: integer("time_saved_hours"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const stageExitCriteriaTable = pgTable("stage_exit_criteria", {
  id: serial("id").primaryKey(),
  stageId: integer("stage_id").notNull(),
  workroomId: integer("workroom_id").notNull(),
  criteriaText: text("criteria_text").notNull(),
  isMet: boolean("is_met").notNull().default(false),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deliverableTemplatesTable = pgTable("deliverable_templates", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  templateName: text("template_name").notNull(),
  deliverableType: text("deliverable_type").notNull(),
  structureJson: jsonb("structure_json"),
  requiredAgents: jsonb("required_agents"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkroomSchema = createInsertSchema(workroomsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWorkroomStageSchema = createInsertSchema(workroomStagesTable).omit({
  id: true,
  createdAt: true,
});
export const insertWorkroomTaskSchema = createInsertSchema(workroomTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertActivityLogSchema = createInsertSchema(activityLogsTable).omit({
  id: true,
  createdAt: true,
});
export const insertStageSummarySchema = createInsertSchema(stageSummariesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWorkroomMetricsSchema = createInsertSchema(workroomMetricsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertStageExitCriteriaSchema = createInsertSchema(stageExitCriteriaTable).omit({
  id: true,
  createdAt: true,
});
export const insertDeliverableTemplateSchema = createInsertSchema(deliverableTemplatesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkroom = z.infer<typeof insertWorkroomSchema>;
export type Workroom = typeof workroomsTable.$inferSelect;
export type WorkroomStage = typeof workroomStagesTable.$inferSelect;
export type WorkroomTask = typeof workroomTasksTable.$inferSelect;
export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type StageSummary = typeof stageSummariesTable.$inferSelect;
export type WorkroomMetrics = typeof workroomMetricsTable.$inferSelect;
export type StageExitCriteria = typeof stageExitCriteriaTable.$inferSelect;
export type DeliverableTemplate = typeof deliverableTemplatesTable.$inferSelect;
