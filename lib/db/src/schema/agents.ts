import { pgTable, text, serial, timestamp, boolean, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slugUrl: text("slug_url").notNull().unique(),
  category: text("category").notNull(),
  agentType: text("agent_type").notNull().default("dialog"),
  functionRole: text("function_role").notNull().default("eksekutor"),
  systemPrompt: text("system_prompt"),
  domainSpesifik: text("domain_spesifik"),
  kepribadian: text("kepribadian"),
  bahasaDefault: text("bahasa_default").notNull().default("Indonesia formal bisnis"),
  levelOtonomi: text("level_otonomi").notNull().default("suggest"),
  inputDibutuhkan: jsonb("input_dibutuhkan"),
  outputDihasilkan: jsonb("output_dihasilkan"),
  isCoreTeam: boolean("is_core_team").notNull().default(false),
  hargaPerUse: decimal("harga_per_use", { precision: 10, scale: 2 }),
  ratingAkurasi: decimal("rating_akurasi", { precision: 4, scale: 2 }),
  totalPenggunaan: integer("total_penggunaan").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
