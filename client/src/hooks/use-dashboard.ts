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
    refetchInterval: 10000, // Check health every 10s
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
    refetchInterval: 5000, // Poll logs every 5s
  });
}
