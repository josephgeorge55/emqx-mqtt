import { useSystemStatus, useTelemetry } from "@/hooks/use-dashboard";
import { StatusCard } from "@/components/StatusCard";
import { TelemetryViewer } from "@/components/TelemetryViewer";
import { motion } from "framer-motion";
import { Anchor, Shield } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = useSystemStatus();
  const { data: telemetry, isLoading: telemetryLoading } = useTelemetry();

  const isSystemHealthy = status?.status === "alive";

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Anchor className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-title">BLADE OUTBOARDS</h1>
                <p className="text-muted-foreground">Blade Marine Technologies Limited</p>
              </div>
            </motion.div>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="relative flex h-3 w-3">
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSystemHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
               <span className={`relative inline-flex rounded-full h-3 w-3 ${isSystemHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
             </span>
             <span className="text-sm font-medium text-muted-foreground" data-testid="text-status">
               {statusLoading ? "Checking..." : isSystemHealthy ? "System Operational" : "System Offline"}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Service Status"
            value={isSystemHealthy ? "Active" : "Down"}
            status={isSystemHealthy ? "healthy" : "error"}
            icon="activity"
            details="Webhook endpoint listener"
          />
          <StatusCard
            title="Devices Tracked"
            value={telemetry ? telemetry.length.toString() : "0"}
            status="healthy"
            icon="database"
            details="GNSS telemetry records"
          />
          <StatusCard
            title="Last Update"
            value={telemetry?.[0]?.receivedAt ? format(new Date(telemetry[0].receivedAt), "HH:mm:ss") : "--:--"}
            status="healthy"
            icon="wifi"
            details="Latest telemetry received"
          />
          <StatusCard
            title="Environment"
            value="Production"
            status="healthy"
            icon="server"
            details="Node.js + PostgreSQL"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Live Telemetry</h2>
          </div>
          <TelemetryViewer data={telemetry} isLoading={telemetryLoading} />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-rose-500/5 rounded-xl border border-rose-500/20 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-rose-500">Security Notice</h3>
              <p className="text-xs text-rose-500/80 leading-relaxed">
                This system is the property of Blade Marine Technologies Limited. Unauthorized access, use, modification, or attempted modification of this system or its data is strictly prohibited. All access attempts are monitored, logged, and recorded. Any unauthorized access or breach will be fully investigated and prosecuted to the maximum extent permitted by law.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date().getFullYear()} Blade Marine Technologies Limited. All rights reserved.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
