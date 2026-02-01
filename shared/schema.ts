import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We'll keep a 'logs' table in Postgres just for the template's sake and maybe persistent logging
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  payload: jsonb("payload").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  status: text("status").notNull(), // 'success' | 'failure'
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLogSchema = createInsertSchema(logs).omit({ id: true, createdAt: true });
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

// MQTT Message Schema based on requirements
// Payload can be JSON object OR string (for STM32 compact frames)
export const mqttMessageSchema = z.object({
  topic: z.string(),
  payload: z.union([z.record(z.any()), z.string(), z.any()]), 
  timestamp: z.number().optional(), // EMQX might not send it in raw mode, but usually does in webhook
});

export type MqttMessage = z.infer<typeof mqttMessageSchema>;
