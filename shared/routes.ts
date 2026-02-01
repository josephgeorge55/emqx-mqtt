import { z } from 'zod';
import { insertLogSchema, insertTelemetrySchema, mqttMessageSchema } from './schema';

export const api = {
  health: {
    check: {
      method: 'GET' as const,
      path: '/api/health',
      responses: {
        200: z.object({ status: z.string() }),
      },
    },
  },
  emqx: {
    receive: {
      method: 'POST' as const,
      path: '/emqx',
      input: mqttMessageSchema,
      responses: {
        200: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      responses: {
        200: z.array(insertLogSchema.extend({ id: z.number(), createdAt: z.string().nullable() })),
      },
    },
  },
  telemetry: {
    list: {
      method: 'GET' as const,
      path: '/api/telemetry',
      responses: {
        200: z.array(insertTelemetrySchema.extend({ id: z.number(), receivedAt: z.string() })),
      },
    },
  },
};
