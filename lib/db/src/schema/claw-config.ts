import { pgTable, serial, integer, text, timestamp, boolean, real, varchar } from "drizzle-orm/pg-core";
import { workroomsTable } from "./workrooms";

export const clawConfigsTable = pgTable("claw_configs", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id")
    .references(() => workroomsTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  name: varchar("name", { length: 255 }).notNull().default("Claw Orchestrator"),
  systemPrompt: text("system_prompt").notNull().default(""),
  model: varchar("model", { length: 50 }).notNull().default("gpt-4o-mini"),
  temperature: real("temperature").notNull().default(0.7),
  maxTokens: integer("max_tokens").notNull().default(2000),
  chunkSize: integer("chunk_size").notNull().default(800),
  chunkOverlap: integer("chunk_overlap").notNull().default(200),
  ragTopK: integer("rag_top_k").notNull().default(5),
  greeting: text("greeting").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clawSubAgentsTable = pgTable("claw_sub_agents", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id")
    .references(() => workroomsTable.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  agentId: integer("agent_id"),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clawQuickPromptsTable = pgTable("claw_quick_prompts", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id")
    .references(() => workroomsTable.id, { onDelete: "cascade" })
    .notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
