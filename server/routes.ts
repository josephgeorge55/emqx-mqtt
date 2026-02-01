import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { firestore } from "./firebase";
import { mqttMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health Check
  app.get(api.health.check.path, (_req, res) => {
    res.json({ status: "alive" });
  });

  // Logs
  app.get(api.logs.list.path, async (_req, res) => {
    const logs = await storage.getLogs();
    res.json(logs);
  });

  // EMQX Webhook
  app.post(api.emqx.receive.path, async (req: Request, res) => {
    const start = Date.now();
    console.log("Received EMQX webhook:", JSON.stringify(req.body));

    // 1. Authentication
    const authHeader = req.headers['authorization'];
    const secret = process.env.EMQX_SECRET;
    
    // Check if secret is set and matches
    // EMQX usually sends "Bearer <token>" or just the token depending on config.
    // We'll check both specific header or just generic match if simpler.
    // Requirement: "Require a secret token stored in environment variables (EMQX_SECRET)"
    
    // We'll assume the client sends it in Authorization header "Bearer <token>" or just exact match
    const token = authHeader?.replace('Bearer ', '');
    
    if (secret && token !== secret) {
      console.warn("Unauthorized access attempt");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2. Message Handling & Validation
    try {
      const message = mqttMessageSchema.parse(req.body);
      const { topic, payload, timestamp } = message;

      // Parse topic: blade/{device_id}/{type}
      const parts = topic.split('/');
      if (parts.length < 3 || parts[0] !== 'blade') {
        throw new Error("Invalid topic format. Expected blade/{device_id}/{type}");
      }

      const deviceId = parts[1];
      const type = parts[2]; // telemetry, gps, status

      // 3. Firestore Integration
      const deviceRef = firestore.collection('devices').doc(deviceId);
      
      // Store message in subcollection
      // devices/{device_id}/{type}/{auto_id}
      await deviceRef.collection(type).add({
        payload,
        timestamp,
        topic,
        serverTimestamp: new Date(),
      });

      // Update metadata
      const updates: any = {
        last_seen: timestamp,
      };

      if (type === 'gps') {
        updates.last_location = payload;
      }

      await deviceRef.set(updates, { merge: true });

      // Log success
      const logEntry = {
        topic,
        payload,
        timestamp: new Date(timestamp),
        status: 'success',
        error: null,
      };
      await storage.createLog(logEntry);
      console.log(`Processed message for device ${deviceId} type ${type}`);

      res.status(200).json({ message: "OK" });

    } catch (error: any) {
      console.error("Error processing message:", error);
      
      // Log failure
      await storage.createLog({
        topic: req.body?.topic || 'unknown',
        payload: req.body?.payload || {},
        timestamp: new Date(),
        status: 'failure',
        error: error.message,
      });

      res.status(400).json({ message: error.message || "Invalid Request" });
    }
  });

  return httpServer;
}
