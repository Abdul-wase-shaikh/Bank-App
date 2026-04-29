import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye } from "lucide-react";
import { AdminAcct, AdminProfile, profileName } from "@/lib/admin/insights";
import { formatCurrency } from "@/lib/format";
import { differenceInDays } from "date-fns";

type Props = {
  accounts: AdminAcct[];
  profiles: Record<string, AdminProfile>;
  txByUser: Record<string, number>;
  onView: (acct: AdminAcct) => void;
};

type BalanceFilter = "all" | "low" | "mid" | "high";
type ActivityFilter = "all" | "active" | "idle";
type JoinFilter = "all" | "7d" | "30d" | "older";

const BALANCE_OPTS: Record<BalanceFilter, [number, number]> = {
  all: [-Infinity, Infinity],
  low: [-Infinity, 1000],
  mid: [1000, 50000],
  high: [50000, Infinity],
};

export const CustomerTable = ({ accounts, profiles, txByUser, onView }: Props) => {
  const [q, setQ] = useState("");
  const [balance, setBalance] = useState<BalanceFilter>("all");
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const [join, setJoin] = useState<JoinFilter>("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return accounts.filter((a) => {
      const name = profileName(profiles, a.user_id, "");
      if (term && !name.toLowerCase().includes(term) && !a.account_number.toLowerCase().includes(term)) return false;
      const [lo, hi] = BALANCE_OPTS[balance];
      const b = Number(a.balance);
      if (b < lo || b > hi) return false;
      const txCount = txByUser[a.user_id] ?? 0;
      if (activity === "active" && txCount === 0) return false;
      if (activity === "idle" && txCount > 0) return false;
      if (join !== "all" && a.created_at) {
        const days = differenceInDays(new Date(), new Date(a.created_at));
        if (join === "7d" && days > 7) return false;
        if (join === "30d" && days > 30) return false;
        if (join === "older" && days <= 30) return false;
      }
      return true;
    });
  }, [accounts, profiles, txByUser, q, balance, activity, join]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-md">
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold">Customers</div>
          <div className="text-xs text-muted-foreground">{filtered.length} of {accounts.length} shown</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or account"
              className="h-9 w-full rounded-lg bg-background/60 pl-9 text-sm sm:w-64"
            />
          </div>
          <Select value={balance} onValueChange={(v) => setBalance(v as BalanceFilter)}>
            <SelectTrigger className="h-9 w-full rounded-lg bg-background/60 text-xs sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All balances</SelectItem>
              <SelectItem value="low">Below 1k</SelectItem>
              <SelectItem value="mid">1k - 50k</SelectItem>
              <SelectItem value="high">Above 50k</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activity} onValueChange={(v) => setActivity(v as ActivityFilter)}>
            <SelectTrigger className="h-9 w-full rounded-lg bg-background/60 text-xs sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any activity</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
            </SelectContent>
          </Select>
          <Select value={join} onValueChange={(v) => setJoin(v as JoinFilter)}>
            <SelectTrigger className="h-9 w-full rounded-lg bg-background/60 text-xs sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any join date</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="older">Older than 30d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-[460px] divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/60 bg-background/30">
        {filtered.length === 0 && (
          <div className="grid h-32 place-items-center text-xs text-muted-foreground">No customers match your filters</div>
        )}
        {filtered.map((a) => {
          const name = profileName(profiles, a.user_id);
          const txCount = txByUser[a.user_id] ?? 0;
          return (
            <div
              key={a.id}
              className="group flex items-center justify-between gap-3 p-3 transition-colors hover:bg-accent/5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-sm">
                  {name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{a.account_number} - {txCount} tx</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatCurrency(a.balance)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onView(a)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
                  aria-label={`View ${name}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
