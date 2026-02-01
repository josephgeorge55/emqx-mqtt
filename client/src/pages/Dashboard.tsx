import { useSystemStatus, useLogs } from "@/hooks/use-dashboard";
import { StatusCard } from "@/components/StatusCard";
import { LogViewer } from "@/components/LogViewer";
import { motion } from "framer-motion";
import { RadioTower, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = useSystemStatus();
  const { data: logs, isLoading: logsLoading } = useLogs();

  const isSystemHealthy = status?.status === "alive";

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <RadioTower className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">MQTT Receiver</h1>
                <p className="text-muted-foreground">Real-time webhook processing & storage</p>
              </div>
            </motion.div>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="relative flex h-3 w-3">
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSystemHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
               <span className={`relative inline-flex rounded-full h-3 w-3 ${isSystemHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
             </span>
             <span className="text-sm font-medium text-muted-foreground">
               {statusLoading ? "Checking..." : isSystemHealthy ? "System Operational" : "System Offline"}
             </span>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Service Status"
            value={isSystemHealthy ? "Active" : "Down"}
            status={isSystemHealthy ? "healthy" : "error"}
            icon="activity"
            details="Webhook endpoint listener"
          />
          <StatusCard
            title="Messages Processed"
            value={logs ? logs.length.toString() : "0"}
            status="healthy"
            icon="database"
            details="Total stored in session"
          />
          <StatusCard
            title="Last Sync"
            value={logs?.[0]?.createdAt ? format(new Date(logs[0].createdAt), "HH:mm:ss") : "--:--"}
            status="healthy"
            icon="wifi"
            details="Latest webhook receipt"
          />
          <StatusCard
            title="Environment"
            value="Production"
            status="healthy"
            icon="server"
            details="Node.js + Firestore"
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Logs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Incoming Webhooks</h2>
              {/* <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button> */}
            </div>
            <LogViewer logs={logs} isLoading={logsLoading} />
          </div>

          {/* Right Column: Info / Config */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Configuration</h2>
            <div className="bg-card rounded-xl border border-border/50 p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Endpoint URL</label>
                <div className="bg-black/20 p-3 rounded-lg border border-border/50 font-mono text-xs break-all text-primary/80">
                  POST /emqx
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Health Check</label>
                <div className="bg-black/20 p-3 rounded-lg border border-border/50 font-mono text-xs break-all text-muted-foreground">
                  GET /api/health
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Expected Payload</label>
                <div className="bg-black/20 p-3 rounded-lg border border-border/50 font-mono text-xs text-muted-foreground">
                  <pre>{`{
  "topic": "string",
  "payload": {},
  "timestamp": 1234567890
}`}</pre>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-6">
               <h3 className="font-semibold text-emerald-500 mb-2">Firestore Connected</h3>
               <p className="text-sm text-emerald-500/80">
                 Messages are automatically written to: <br/>
                 <code className="bg-emerald-500/10 px-1 py-0.5 rounded text-xs mt-1 block w-fit">devices/{`{device_id}`}/{`{type}`}</code>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
