import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { workroomsTable } from "./workrooms";

export const workroomBrainTable = pgTable("workroom_brain", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").references(() => workroomsTable.id, { onDelete: "cascade" }).notNull().unique(),
  context: text("context"),
  goals: text("goals"),
  constraints: text("constraints"),
  stakeholders: text("stakeholders"),
  decisions: text("decisions"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
