import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  value: number;
  format?: (n: number) => string;
  accent?: "primary" | "violet" | "emerald" | "amber";
  trendLabel?: string;
};

const ACCENTS: Record<NonNullable<Props["accent"]>, string> = {
  primary: "from-primary/20 to-accent/10 text-primary",
  violet: "from-violet-500/20 to-fuchsia-500/10 text-violet-400",
  emerald: "from-emerald-500/20 to-teal-500/10 text-emerald-400",
  amber: "from-amber-500/20 to-orange-500/10 text-amber-400",
};

export const StatCard = ({ icon: Icon, label, value, format, accent = "primary", trendLabel }: Props) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_30px_rgba(20,184,166,0.18)]">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-300 group-hover:opacity-100", `bg-gradient-to-br ${ACCENTS[accent]}`)} aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={cn("grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-background/60 shadow-sm transition-transform duration-300 group-hover:scale-110", ACCENTS[accent].split(" ").pop())}>
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </div>
        </div>
        <div className="mt-3 font-display text-3xl font-bold tracking-tight">
          <AnimatedNumber value={value} format={format} />
        </div>
        {trendLabel && <div className="mt-1 text-xs text-muted-foreground">{trendLabel}</div>}
      </div>
    </div>
  );
};
