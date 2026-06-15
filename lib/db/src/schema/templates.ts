import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workflowTemplatesTable = pgTable("workflow_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  description: text("description").notNull(),
  outputFinal: text("output_final").notNull(),
  mode: text("mode").notNull().default("profesional"),
  complexityScore: integer("complexity_score").notNull().default(3),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const templateRolesTable = pgTable("template_roles", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  namaPeran: text("nama_peran").notNull(),
  fungsiPeran: text("fungsi_peran").notNull(),
  agentId: integer("agent_id"),
  urutan: integer("urutan").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const templateStagesTable = pgTable("template_stages", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  urutan: integer("urutan").notNull(),
  namaTahap: text("nama_tahap").notNull(),
  tipeTahap: text("tipe_tahap").notNull().default("kerja"),
  polaOperan: text("pola_operan").notNull().default("sequential"),
  gateCriteria: text("gate_criteria"),
  exitCriteria: text("exit_criteria"),
  gateType: text("gate_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTemplateRoleSchema = createInsertSchema(templateRolesTable).omit({
  id: true,
  createdAt: true,
});
export const insertTemplateStageSchema = createInsertSchema(templateStagesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;
export type WorkflowTemplate = typeof workflowTemplatesTable.$inferSelect;
export type TemplateRole = typeof templateRolesTable.$inferSelect;
export type TemplateStage = typeof templateStagesTable.$inferSelect;
