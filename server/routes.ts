import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { firestore } from "./firebase";
import { mqttMessageSchema, type GnssPayload } from "@shared/schema";
import express from "express";

// Parse GNSS payload format: device_name,serial_number,$GNSS,Gx,latitude,longitude,status
function parseGnssPayload(payload: string): GnssPayload | null {
  try {
    const parts = payload.split(',');
    if (parts.length < 7 || parts[2] !== '$GNSS') {
      return null;
    }
    
    return {
      deviceName: parts[0].trim(),
      serialNumber: parts[1].trim(),
      gnssType: parts[3].trim(),  // G1, G2, etc.
      latitude: parseFloat(parts[4]),
      longitude: parseFloat(parts[5]),
      status: parts[6].trim(),
    };
  } catch (e) {
    console.error("Failed to parse GNSS payload:", e);
    return null;
  }
}

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

  // Telemetry endpoint - get stored GNSS data
  app.get("/api/telemetry", async (_req, res) => {
    const data = await storage.getTelemetry();
    res.json(data);
  });

  // EMQX Webhook
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

      // Try to parse as JSON first (EMQX wraps payload in JSON envelope)
      if (typeof rawBody === 'string' && rawBody.trim().startsWith('{')) {
        try {
          messageData = JSON.parse(rawBody);
        } catch (e) {
          messageData = null;
        }
      }

      // If not JSON, construct message from headers + raw body
      if (!messageData) {
        const topic = req.headers['x-mqtt-topic'] as string || 
                      req.headers['x-emqx-topic'] as string || 
                      'blade/unknown/raw';
        
        messageData = {
          topic: topic,
          payload: rawBody,
          timestamp: Date.now()
        };
      }

      if (!messageData.timestamp) {
        messageData.timestamp = Date.now();
      }

      const message = mqttMessageSchema.parse(messageData);
      const { topic, payload, timestamp } = message;

      // Get the actual payload string
      let payloadStr = typeof payload === 'string' 
        ? payload 
        : (payload?.payload ? String(payload.payload) : JSON.stringify(payload));

      console.log("Processing payload:", payloadStr);

      // Try to parse as GNSS format
      const gnssData = parseGnssPayload(payloadStr);
      
      if (gnssData) {
        console.log("Parsed GNSS data:", gnssData);
        
        // Store in PostgreSQL telemetry table (new row every time)
        const telemetryRecord = await storage.createTelemetry({
          deviceName: gnssData.deviceName,
          serialNumber: gnssData.serialNumber,
          gnssType: gnssData.gnssType,
          latitude: gnssData.latitude,
          longitude: gnssData.longitude,
          status: gnssData.status,
          rawPayload: payloadStr,
        });
        console.log("Stored telemetry record:", telemetryRecord.id);

        // Also store in Firestore for real-time access
        try {
          const deviceRef = firestore.collection('devices').doc(gnssData.deviceName);
          
          // Add to telemetry subcollection
          await deviceRef.collection('telemetry').add({
            ...gnssData,
            rawPayload: payloadStr,
            timestamp: new Date(timestamp),
            serverTimestamp: new Date(),
          });

          // Update device metadata with last known position
          await deviceRef.set({
            serialNumber: gnssData.serialNumber,
            lastSeen: new Date(),
            lastLatitude: gnssData.latitude,
            lastLongitude: gnssData.longitude,
            lastStatus: gnssData.status,
          }, { merge: true });

          console.log(`Firestore updated for device ${gnssData.deviceName}`);
        } catch (fsError: any) {
          console.error("Firestore write failed:", fsError.message);
        }

        // Log success
        await storage.createLog({
          topic,
          payload: gnssData as any,
          timestamp: new Date(timestamp),
          status: 'success',
          error: null,
        });

        return res.status(200).json({ message: "OK", deviceName: gnssData.deviceName });
      }

      // Fallback: Not GNSS format - store as raw
      console.log("Payload is not GNSS format, storing as raw");
      
      const parts = topic.toString().split('/');
      const deviceId = parts.length >= 2 ? parts[1] : 'unknown_device';
      const type = parts.length >= 3 ? parts[2] : 'raw';

      try {
        const deviceRef = firestore.collection('devices').doc(deviceId);
        
        await deviceRef.collection(type).add({
          payload: payloadStr,
          timestamp: new Date(timestamp),
          topic,
          serverTimestamp: new Date(),
        });

        await deviceRef.set({
          lastSeen: new Date(),
        }, { merge: true });

      } catch (fsError: any) {
        console.error("Firestore write failed:", fsError.message);
      }

      await storage.createLog({
        topic,
        payload: typeof payload === 'object' ? payload : { raw: payloadStr },
        timestamp: new Date(timestamp),
        status: 'success',
        error: null,
      });

      res.status(200).json({ message: "OK" });

    } catch (error: any) {
      console.error("Error processing message:", error);
      
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
