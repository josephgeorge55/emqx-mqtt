import { logs, type InsertLog, type Log } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createLog(log: InsertLog): Promise<Log>;
  getLogs(limit?: number): Promise<Log[]>;
}

export class DatabaseStorage implements IStorage {
  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db.insert(logs).values(insertLog).returning();
    return log;
  }

  async getLogs(limit: number = 50): Promise<Log[]> {
    return db.select().from(logs).orderBy(desc(logs.timestamp)).limit(limit);
  }
}

export const storage = new DatabaseStorage();
