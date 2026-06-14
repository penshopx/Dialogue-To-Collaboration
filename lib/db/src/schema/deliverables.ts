import { pgTable, serial, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { workroomsTable, workroomStagesTable } from "./workrooms";

export const deliverablesTable = pgTable("deliverables", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").references(() => workroomsTable.id, { onDelete: "cascade" }).notNull(),
  stageId: integer("stage_id").references(() => workroomStagesTable.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  format: varchar("format", { length: 50 }).notNull().default("document"),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
