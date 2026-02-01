import { logs, telemetry, type InsertLog, type Log, type InsertTelemetry, type Telemetry } from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";

export interface IStorage {
  createLog(log: InsertLog): Promise<Log>;
  getLogs(limit?: number): Promise<Log[]>;
  createTelemetry(data: InsertTelemetry): Promise<Telemetry>;
  getTelemetry(limit?: number): Promise<Telemetry[]>;
}

export class DatabaseStorage implements IStorage {
  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db.insert(logs).values(insertLog).returning();
    return log;
  }

  async getLogs(limit: number = 50): Promise<Log[]> {
    return db.select().from(logs).orderBy(desc(logs.createdAt)).limit(limit);
  }

  async createTelemetry(data: InsertTelemetry): Promise<Telemetry> {
    const [record] = await db.insert(telemetry).values(data).returning();
    return record;
  }

  async getTelemetry(limit: number = 100): Promise<Telemetry[]> {
    return db.select().from(telemetry).orderBy(desc(telemetry.receivedAt)).limit(limit);
  }
}

export const storage = new DatabaseStorage();
