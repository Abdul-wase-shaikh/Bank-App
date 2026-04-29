import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";
import { AdminProfile, AdminTx, profileName } from "@/lib/admin/insights";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  txs: AdminTx[];
  profiles: Record<string, AdminProfile>;
  highlightIds?: Set<string>;
};

type TypeFilter = "all" | "deposit" | "withdraw" | "transfer";
type RangeFilter = "all" | "24h" | "7d" | "30d";

const TX_ICON = {
  deposit: ArrowDownToLine,
  withdraw: ArrowUpFromLine,
  transfer: ArrowLeftRight,
};

const SUSPICIOUS_THRESHOLD = 50000;

export const TransactionsPanel = ({ txs, profiles, highlightIds }: Props) => {
  const maxAmount = useMemo(() => Math.max(1000, ...txs.map((t) => Number(t.amount))), [txs]);
  const [type, setType] = useState<TypeFilter>("all");
  const [range, setRange] = useState<RangeFilter>("all");
  const [amount, setAmount] = useState<number>(0);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return txs.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (range !== "all") {
        const days = differenceInDays(new Date(), new Date(t.created_at));
        if (range === "24h" && days >= 1) return false;
        if (range === "7d" && days > 7) return false;
        if (range === "30d" && days > 30) return false;
      }
      if (Number(t.amount) < amount) return false;
      if (term) {
        const name = profileName(profiles, t.user_id, "").toLowerCase();
        const desc = (t.description ?? "").toLowerCase();
        if (!name.includes(term) && !desc.includes(term) && !t.type.includes(term)) return false;
      }
      return true;
    });
  }, [txs, type, range, amount, q, profiles]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-md">
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold">Live transactions</div>
          <div className="text-xs text-muted-foreground">{filtered.length} of {txs.length} shown</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search description or name"
            className="h-9 w-full rounded-lg bg-background/60 text-sm sm:w-56"
          />
          <Select value={type} onValueChange={(v) => setType(v as TypeFilter)}>
            <SelectTrigger className="h-9 w-full rounded-lg bg-background/60 text-xs sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any type</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdraw">Withdraw</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
            <SelectTrigger className="h-9 w-full rounded-lg bg-background/60 text-xs sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Min amount</span>
        <Slider
          value={[amount]}
          max={maxAmount}
          step={Math.max(1, Math.floor(maxAmount / 100))}
          onValueChange={(v) => setAmount(v[0])}
          className="flex-1"
        />
        <span className="w-24 shrink-0 text-right text-xs font-medium tabular-nums">{formatCurrency(amount)}</span>
      </div>

      <div className="max-h-[420px] divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/60 bg-background/30">
        {filtered.length === 0 && (
          <div className="grid h-32 place-items-center text-xs text-muted-foreground">No transactions match your filters</div>
        )}
        {filtered.map((t) => {
          const Icon = TX_ICON[t.type];
          const positive = t.type === "deposit";
          const flagged = Number(t.amount) >= SUSPICIOUS_THRESHOLD;
          const fresh = highlightIds?.has(t.id);
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-center justify-between gap-3 p-3 transition-colors",
                fresh ? "animate-in fade-in slide-in-from-top-1 bg-accent/10" : "hover:bg-accent/5",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                  positive ? "bg-emerald-500/15 text-emerald-400" : t.type === "withdraw" ? "bg-amber-500/15 text-amber-400" : "bg-violet-500/15 text-violet-300",
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm capitalize">
                    {t.type}
                    {flagged && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-300">
                        <AlertTriangle className="h-2.5 w-2.5" /> Flagged
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {profileName(profiles, t.user_id)} - {formatDate(t.created_at)}
                  </div>
                </div>
              </div>
              <div className={cn("text-sm font-semibold", positive && "text-emerald-400")}>{positive ? "+" : "-"}{formatCurrency(t.amount)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
