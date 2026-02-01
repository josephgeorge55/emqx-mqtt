import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import type { Telemetry } from "@shared/schema";

interface TelemetryViewerProps {
  data: Telemetry[] | undefined;
  isLoading: boolean;
}

export function TelemetryViewer({ data, isLoading }: TelemetryViewerProps) {
  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground/50">
        <div className="flex flex-col items-center gap-2">
          <Navigation className="w-8 h-8 animate-pulse" />
          <p className="text-sm font-mono">Loading telemetry...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-xl">
        <div className="flex flex-col items-center gap-2">
          <MapPin className="w-8 h-8" />
          <p className="text-sm font-medium">No telemetry data yet</p>
          <p className="text-xs">Waiting for GNSS messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/30 rounded-xl border border-border/50 overflow-hidden">
      <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2">
        <Navigation className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live GNSS Telemetry</span>
        <span className="ml-auto text-xs text-muted-foreground">{data.length} records</span>
      </div>
      <ScrollArea className="h-[500px] w-full">
        <table className="w-full text-sm" data-testid="table-telemetry">
          <thead className="sticky top-0 bg-background/95 backdrop-blur border-b border-border/50">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {data.map((item: any) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-border/30 hover:bg-white/5 transition-colors"
                  data-testid={`row-telemetry-${item.id}`}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {item.receivedAt ? format(new Date(item.receivedAt), "HH:mm:ss") : "--:--:--"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{item.deviceName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-muted-foreground">{item.serialNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-primary/80">
                      {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'moving' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.status === 'stop'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
