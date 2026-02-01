import { pgTable, text, serial, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main telemetry table for GNSS data - each message is a new row for ML/AI analysis
export const telemetry = pgTable("telemetry", {
  id: serial("id").primaryKey(),
  deviceName: text("device_name").notNull(),        // e.g., BLADE_HALO_6
  serialNumber: text("serial_number").notNull(),    // e.g., JK8892432
  gnssType: text("gnss_type").notNull(),            // e.g., G1, G2, etc.
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  status: text("status").notNull(),                 // e.g., stop, moving, idle
  rawPayload: text("raw_payload"),                  // Original message for debugging
  receivedAt: timestamp("received_at").defaultNow().notNull(), // When server received it
});

export const insertTelemetrySchema = createInsertSchema(telemetry).omit({ id: true, receivedAt: true });
export type InsertTelemetry = z.infer<typeof insertTelemetrySchema>;
export type Telemetry = typeof telemetry.$inferSelect;

// Keep logs table for webhook processing status
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

// MQTT Message Schema - flexible for various payload formats
export const mqttMessageSchema = z.object({
  topic: z.string(),
  payload: z.union([z.record(z.any()), z.string(), z.any()]), 
  timestamp: z.number().optional(),
});

export type MqttMessage = z.infer<typeof mqttMessageSchema>;

// GNSS payload parser - format: device_name,serial_number,$GNSS,Gx,latitude,longitude,status
export const gnssPayloadSchema = z.object({
  deviceName: z.string(),
  serialNumber: z.string(),
  gnssType: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  status: z.string(),
});

export type GnssPayload = z.infer<typeof gnssPayloadSchema>;
