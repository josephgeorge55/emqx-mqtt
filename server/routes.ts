import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { firestore } from "./firebase";
import { mqttMessageSchema } from "@shared/schema";
import { z } from "zod";
import express from "express";

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
  // Accept any content type - JSON, text, binary, raw
  app.post(
    api.emqx.receive.path, 
    express.raw({ type: '*/*', limit: '10mb' }),
    async (req: Request, res) => {
    
    console.log("Received EMQX webhook headers:", JSON.stringify(req.headers));
    console.log("Received EMQX webhook body:", typeof req.body, req.body);

    // 1. Authentication
    const authHeader = req.headers['authorization'];
    const secret = process.env.EMQX_SECRET;
    const token = authHeader?.replace('Bearer ', '');
    
    // Check if secret is set and matches
    if (secret && token !== secret) {
      console.warn("Unauthorized access attempt");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2. Message Handling
    try {
      let messageData;
      let rawBody = req.body;

      // Convert Buffer to string if needed
      if (Buffer.isBuffer(rawBody)) {
        rawBody = rawBody.toString('utf-8');
        console.log("Converted buffer to string:", rawBody);
      }

      // Try to parse as JSON first (EMQX might wrap payload in JSON envelope)
      if (typeof rawBody === 'string' && rawBody.trim().startsWith('{')) {
        try {
          messageData = JSON.parse(rawBody);
        } catch (e) {
          // Not valid JSON, treat as raw payload
          messageData = null;
        }
      }

      // If not JSON, construct message from headers + raw body
      if (!messageData) {
        // EMQX can send topic in headers when using raw mode
        const topic = req.headers['x-mqtt-topic'] as string || 
                      req.headers['x-emqx-topic'] as string || 
                      'blade/unknown/raw';
        
        messageData = {
          topic: topic,
          payload: rawBody, // Raw STM32 frame as string or hex
          timestamp: Date.now()
        };
      }

      // Validate/Shape
      // If timestamp is missing, add it
      if (!messageData.timestamp) {
        messageData.timestamp = Date.now();
      }

      const message = mqttMessageSchema.parse(messageData);
      const { topic, payload, timestamp } = message;

      // Parse topic: blade/{device_id}/{type}
      const parts = topic.toString().split('/');
      // Allow loose topic matching for now since "unknown/topic" might be used
      const deviceId = parts.length >= 2 ? parts[1] : 'unknown_device';
      const type = parts.length >= 3 ? parts[2] : 'telemetry';

      // 3. Firestore Integration
      // Only attempt write if we have a collection reference (i.e. admin initialized)
      // We check if 'firestore' is valid. 
      // Note: firestore export is always defined but might throw on access if not initialized? 
      // Actually admin.firestore() returns a client even if not fully authed, but operations will fail.
      
      try {
        const deviceRef = firestore.collection('devices').doc(deviceId);
        
        // Store message in subcollection
        await deviceRef.collection(type).add({
          payload, // This can be string or object now
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
        console.log(`Processed message for device ${deviceId} type ${type}`);
        
        // Log success
        await storage.createLog({
            topic,
            payload: typeof payload === 'object' ? payload : { raw: payload },
            timestamp: new Date(timestamp),
            status: 'success',
            error: null,
        });

        res.status(200).json({ message: "OK" });

      } catch (fsError: any) {
        console.error("Firestore write failed:", fsError.message);
        // We still consider it "processed" by the webhook receiver, but failed persistence
        // Log failure
        await storage.createLog({
            topic,
            payload: typeof payload === 'object' ? payload : { raw: payload },
            timestamp: new Date(timestamp),
            status: 'failure',
            error: `Firestore error: ${fsError.message}`,
        });
        
        // If it's an auth error, it means service account is missing/invalid
        if (fsError.message.includes("credential")) {
             return res.status(500).json({ message: "Server configuration error (Database Auth)" });
        }
        throw fsError;
      }

    } catch (error: any) {
      console.error("Error processing message:", error);
      
      // Log failure (if we have enough info)
      try {
        await storage.createLog({
            topic: req.body?.topic || 'unknown',
            payload: { raw: typeof req.body === 'string' ? req.body : JSON.stringify(req.body) },
            timestamp: new Date(),
            status: 'failure',
            error: error.message,
        });
      } catch (e) {
        // Ignore log failure
      }

      res.status(400).json({ message: error.message || "Invalid Request" });
    }
  });

  return httpServer;
}
