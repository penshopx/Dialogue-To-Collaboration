import { pgTable, serial, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { workroomsTable } from "./workrooms";

export const knowledgeBaseItems = pgTable("knowledge_base_items", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").references(() => workroomsTable.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("text"),
  layer: varchar("layer", { length: 50 }).notNull().default("operational"),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
