import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

// GET /api/health
export function useSystemStatus() {
  return useQuery({
    queryKey: [api.health.check.path],
    queryFn: async () => {
      const res = await fetch(api.health.check.path);
      if (!res.ok) throw new Error("Failed to fetch status");
      return api.health.check.responses[200].parse(await res.json());
    },
    refetchInterval: 10000,
  });
}

// GET /api/logs
export function useLogs() {
  return useQuery({
    queryKey: [api.logs.list.path],
    queryFn: async () => {
      const res = await fetch(api.logs.list.path);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      return api.logs.list.responses[200].parse(data);
    },
    refetchInterval: 5000,
  });
}

// GET /api/telemetry
export function useTelemetry() {
  return useQuery({
    queryKey: [api.telemetry.list.path],
    queryFn: async () => {
      const res = await fetch(api.telemetry.list.path);
      if (!res.ok) throw new Error("Failed to fetch telemetry");
      return res.json();
    },
    refetchInterval: 3000,
  });
}
