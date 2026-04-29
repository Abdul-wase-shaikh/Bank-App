import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { AdminAcct, AdminTx, profileName, AdminProfile } from "@/lib/admin/insights";
import { formatCurrency } from "@/lib/format";

type Props = {
  txs: AdminTx[];
  accounts: AdminAcct[];
  profiles: Record<string, AdminProfile>;
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#a78bfa"];

export const AdminCharts = ({ txs, accounts, profiles }: Props) => {
  const tsByDay = useMemo(() => {
    const days: { date: string; volume: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      days.push({ date: format(d, "MMM d"), volume: 0, count: 0 });
    }
    txs.forEach((t) => {
      const d = startOfDay(new Date(t.created_at));
      const label = format(d, "MMM d");
      const slot = days.find((x) => x.date === label);
      if (slot) {
        slot.volume += Number(t.amount);
        slot.count += 1;
      }
    });
    return days;
  }, [txs]);

  const typeRatio = useMemo(() => {
    const counts: Record<string, number> = { deposit: 0, withdraw: 0, transfer: 0 };
    txs.forEach((t) => {
      counts[t.type] = (counts[t.type] ?? 0) + Number(t.amount);
    });
    return [
      { name: "Deposit", value: counts.deposit },
      { name: "Withdraw", value: counts.withdraw },
      { name: "Transfer", value: counts.transfer },
    ].filter((d) => d.value > 0);
  }, [txs]);

  const topCustomers = useMemo(() => {
    return [...accounts]
      .sort((a, b) => Number(b.balance) - Number(a.balance))
      .slice(0, 5)
      .map((a) => ({
        name: profileName(profiles, a.user_id, a.account_number).slice(0, 14),
        balance: Number(a.balance),
      }));
  }, [accounts, profiles]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-md xl:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Transactions over time</div>
            <div className="text-xs text-muted-foreground">Volume across the last 14 days</div>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tsByDay} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Line type="monotone" dataKey="volume" stroke="url(#lineGrad)" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-md">
        <div className="mb-3">
          <div className="text-sm font-semibold">Flow distribution</div>
          <div className="text-xs text-muted-foreground">Deposit vs withdraw vs transfer</div>
        </div>
        <div className="h-56">
          {typeRatio.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeRatio} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={3} stroke="none">
                  {typeRatio.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">No transaction data yet</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-md xl:col-span-3">
        <div className="mb-3">
          <div className="text-sm font-semibold">Top customers by balance</div>
          <div className="text-xs text-muted-foreground">Largest five accounts</div>
        </div>
        <div className="h-56">
          {topCustomers.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="balance" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">No accounts yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
