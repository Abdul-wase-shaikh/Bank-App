import { Sparkles, Activity, Crown, AlertTriangle, BatteryLow, TrendingUp } from "lucide-react";
import { Insight } from "@/lib/admin/insights";

const ICON: Record<Insight["kind"], typeof Sparkles> = {
  active: Activity,
  highest: Crown,
  unusual: AlertTriangle,
  low: BatteryLow,
  growth: TrendingUp,
};

const ACCENT: Record<Insight["kind"], string> = {
  active: "from-cyan-500/20 to-emerald-500/10 text-cyan-300",
  highest: "from-amber-500/20 to-orange-500/10 text-amber-300",
  unusual: "from-rose-500/20 to-fuchsia-500/10 text-rose-300",
  low: "from-orange-500/20 to-rose-500/10 text-orange-300",
  growth: "from-violet-500/20 to-fuchsia-500/10 text-violet-300",
};

type Props = { insights: Insight[] };

export const InsightsPanel = ({ insights }: Props) => {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <div>
          <div className="text-sm font-semibold">Smart insights</div>
          <div className="text-xs text-muted-foreground">Auto-generated from live data</div>
        </div>
      </div>
      {insights.length === 0 ? (
        <div className="grid h-32 place-items-center rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
          Once accounts and transactions arrive, insights will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {insights.map((i) => {
            const Icon = ICON[i.kind];
            return (
              <div
                key={i.id}
                className={`group relative overflow-hidden rounded-xl border border-border/60 bg-background/40 p-3 transition-all hover:-translate-y-0.5 hover:border-accent/40`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-90 ${ACCENT[i.kind]}`} aria-hidden />
                <div className="relative flex items-start gap-3">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/60 bg-background/60 ${ACCENT[i.kind].split(" ").pop()}`}>
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{i.title}</div>
                    <div className="text-[11px] text-muted-foreground">{i.detail}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
