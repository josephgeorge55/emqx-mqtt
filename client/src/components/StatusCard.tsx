import { motion } from "framer-motion";
import { Activity, Server, Database, Wifi, CheckCircle, XCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string;
  status: "healthy" | "warning" | "error";
  icon: "activity" | "server" | "database" | "wifi" | "check" | "error" | "inbox";
  details?: string;
}

const icons = {
  activity: Activity,
  server: Server,
  database: Database,
  wifi: Wifi,
  check: CheckCircle,
  error: XCircle,
  inbox: Inbox,
};

export function StatusCard({ title, value, status, icon, details }: StatusCardProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-foreground tracking-tight">{value}</h3>
          {details && <p className="text-xs text-muted-foreground mt-1">{details}</p>}
        </div>
        <div
          className={cn(
            "p-3 rounded-xl",
            status === "healthy" && "bg-emerald-500/10 text-emerald-500",
            status === "warning" && "bg-amber-500/10 text-amber-500",
            status === "error" && "bg-rose-500/10 text-rose-500"
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {status === "healthy" && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
      )}
      {status === "error" && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/50 to-transparent" />
      )}
    </motion.div>
  );
}
