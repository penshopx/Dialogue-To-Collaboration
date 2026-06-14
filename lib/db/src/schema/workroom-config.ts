import { pgTable, serial, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { workroomsTable } from "./workrooms";

export const workroomConfigTable = pgTable("workroom_config", {
  id: serial("id").primaryKey(),
  workroomId: integer("workroom_id").references(() => workroomsTable.id, { onDelete: "cascade" }).notNull().unique(),
  personaName: varchar("persona_name", { length: 100 }),
  personaDesc: text("persona_desc"),
  personaTone: varchar("persona_tone", { length: 50 }).default("professional"),
  personaLanguage: varchar("persona_language", { length: 50 }).default("id"),
  personaEmoji: varchar("persona_emoji", { length: 10 }).default("🤖"),
  policies: text("policies"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
