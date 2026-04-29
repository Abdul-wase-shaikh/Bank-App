import { Bell, AlertTriangle, BatteryLow, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdminAlert } from "@/lib/admin/insights";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const LEVEL_ICON = {
  danger: AlertTriangle,
  warning: BatteryLow,
  success: CheckCircle2,
};

const LEVEL_CLS = {
  danger: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const DOT_CLS = {
  danger: "bg-rose-400",
  warning: "bg-amber-400",
  success: "bg-emerald-400",
};

type Props = { alerts: AdminAlert[] };

export const AdminBell = ({ alerts }: Props) => {
  const danger = alerts.filter((a) => a.level === "danger").length;
  const total = alerts.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Admin alerts"
          className="relative grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-secondary/40 backdrop-blur-md transition-colors hover:border-accent/60 hover:bg-secondary/70"
        >
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span className={cn(
              "absolute -right-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white shadow-md",
              danger > 0 ? "bg-rose-500" : "bg-accent",
            )}>
              {total}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 border-border/60 bg-card/95 p-0 backdrop-blur-xl">
        <div className="border-b border-border/60 px-4 py-3">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="text-xs text-muted-foreground">{total} signals from the last activity</div>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {alerts.length === 0 && (
            <div className="grid h-32 place-items-center text-xs text-muted-foreground">All quiet on the floor</div>
          )}
          {alerts.map((a) => {
            const Icon = LEVEL_ICON[a.level];
            return (
              <div key={a.id} className="flex items-start gap-3 p-3 transition-colors hover:bg-accent/5">
                <div className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border", LEVEL_CLS[a.level])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLS[a.level])} />
                    <span className="text-sm font-medium">{a.title}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{a.detail}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground/70">{formatDate(a.at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
