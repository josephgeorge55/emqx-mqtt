import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, CheckCircle2, XCircle } from "lucide-react";
import type { Log } from "@shared/schema";

interface LogViewerProps {
  logs: (Log & { id: number })[] | undefined;
  isLoading: boolean;
}

export function LogViewer({ logs, isLoading }: LogViewerProps) {
  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground/50">
        <div className="flex flex-col items-center gap-2">
          <Terminal className="w-8 h-8 animate-pulse" />
          <p className="text-sm font-mono">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-xl">
        <div className="flex flex-col items-center gap-2">
          <Terminal className="w-8 h-8" />
          <p className="text-sm font-medium">No webhook logs yet</p>
          <p className="text-xs">Waiting for MQTT messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/30 rounded-xl border border-border/50 overflow-hidden font-mono text-sm">
      <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Ingestion Log</span>
      </div>
      <ScrollArea className="h-[500px] w-full p-4">
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="group flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
              >
                <div className="mt-0.5 shrink-0">
                  {log.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">
                      {log.createdAt ? format(new Date(log.createdAt), "HH:mm:ss.SSS") : "--:--:--"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/20">
                      {log.topic}
                    </span>
                  </div>
                  <pre className="text-xs text-muted-foreground/80 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                  {log.error && (
                    <p className="text-xs text-rose-400 mt-1 border-l-2 border-rose-500/50 pl-2">
                      Error: {log.error}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
