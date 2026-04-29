import { Link } from "react-router-dom";
import { UserPlus, FileDown, RefreshCw, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onRefresh: () => void;
  onExport: () => void;
  liveOn: boolean;
  onToggleLive: () => void;
};

const ACTION_BTN =
  "group relative flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-left text-sm font-medium backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_6px_24px_rgba(20,184,166,0.18)]";

export const QuickActions = ({ onRefresh, onExport, liveOn, onToggleLive }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Link to="/register" className={ACTION_BTN}>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
          <UserPlus className="h-4 w-4" />
        </span>
        <span>
          <span className="block">Add customer</span>
          <span className="block text-[11px] font-normal text-muted-foreground">Open sign-up</span>
        </span>
      </Link>

      <button type="button" onClick={onExport} className={ACTION_BTN}>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/20 text-violet-300 shadow-sm transition-transform group-hover:scale-110">
          <FileDown className="h-4 w-4" />
        </span>
        <span>
          <span className="block">Export report</span>
          <span className="block text-[11px] font-normal text-muted-foreground">CSV download</span>
        </span>
      </button>

      <button type="button" onClick={onRefresh} className={ACTION_BTN}>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300 shadow-sm transition-transform group-hover:scale-110">
          <RefreshCw className="h-4 w-4" />
        </span>
        <span>
          <span className="block">Refresh now</span>
          <span className="block text-[11px] font-normal text-muted-foreground">Reload data</span>
        </span>
      </button>

      <button type="button" onClick={onToggleLive} className={cn(ACTION_BTN, liveOn && "border-accent/60 shadow-[0_6px_24px_rgba(20,184,166,0.22)]")}> 
        <span className={cn(
          "grid h-9 w-9 place-items-center rounded-lg shadow-sm transition-transform group-hover:scale-110",
          liveOn ? "bg-accent/30 text-accent" : "bg-amber-500/20 text-amber-300",
        )}>
          <BellRing className="h-4 w-4" />
        </span>
        <span>
          <span className="block">Live updates {liveOn ? "on" : "off"}</span>
          <span className="block text-[11px] font-normal text-muted-foreground">Auto-refresh 10s</span>
        </span>
      </button>

      <Button variant="outline" size="sm" asChild className="hidden">
        <span />
      </Button>
    </div>
  );
};
