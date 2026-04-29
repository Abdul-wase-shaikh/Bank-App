import { differenceInHours, isToday, startOfWeek, isAfter } from "date-fns";

export type AdminAcct = {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  created_at?: string;
};

export type AdminTx = {
  id: string;
  user_id: string;
  type: "deposit" | "withdraw" | "transfer";
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string | null;
  created_at: string;
};

export type AdminProfile = {
  id: string;
  full_name: string | null;
};

export type Insight = {
  id: string;
  kind: "active" | "highest" | "unusual" | "low" | "growth";
  title: string;
  detail: string;
};

export type AdminAlert = {
  id: string;
  level: "danger" | "warning" | "success";
  title: string;
  detail: string;
  at: string;
};

const ODD_HOUR_START = 0;
const ODD_HOUR_END = 5;
const LARGE_TX_THRESHOLD = 50000;
const LOW_BALANCE_THRESHOLD = 100;

export function profileName(profiles: Record<string, AdminProfile>, userId: string, fallback = "Customer") {
  return profiles[userId]?.full_name?.trim() || fallback;
}

export function buildInsights(
  accounts: AdminAcct[],
  txs: AdminTx[],
  profiles: Record<string, AdminProfile>,
): Insight[] {
  const out: Insight[] = [];

  // Most active user today
  const today = txs.filter((t) => isToday(new Date(t.created_at)));
  if (today.length) {
    const counts = new Map<string, number>();
    today.forEach((t) => counts.set(t.user_id, (counts.get(t.user_id) ?? 0) + 1));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    out.push({
      id: "active",
      kind: "active",
      title: "Most active today",
      detail: `${profileName(profiles, top[0])} - ${top[1]} transactions`,
    });
  }

  // Highest transaction this week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekTx = txs.filter((t) => isAfter(new Date(t.created_at), weekStart));
  if (weekTx.length) {
    const top = [...weekTx].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
    out.push({
      id: "highest",
      kind: "highest",
      title: "Largest this week",
      detail: `${profileName(profiles, top.user_id)} - ${top.type} of INR ${Number(top.amount).toLocaleString("en-IN")}`,
    });
  }

  // Unusual activity
  const unusual = txs.find(
    (t) =>
      Number(t.amount) >= LARGE_TX_THRESHOLD ||
      (() => {
        const h = new Date(t.created_at).getHours();
        return h >= ODD_HOUR_START && h < ODD_HOUR_END;
      })(),
  );
  if (unusual) {
    out.push({
      id: "unusual",
      kind: "unusual",
      title: "Unusual activity",
      detail: `${profileName(profiles, unusual.user_id)} - ${unusual.type} of INR ${Number(unusual.amount).toLocaleString("en-IN")}`,
    });
  }

  // Low balance accounts
  const low = accounts.filter((a) => Number(a.balance) < LOW_BALANCE_THRESHOLD);
  if (low.length) {
    out.push({
      id: "low",
      kind: "low",
      title: "Low balance accounts",
      detail: `${low.length} ${low.length === 1 ? "customer is" : "customers are"} below INR ${LOW_BALANCE_THRESHOLD}`,
    });
  }

  // Growth signal: deposits in last 24h vs withdrawals
  const last24h = txs.filter((t) => differenceInHours(new Date(), new Date(t.created_at)) < 24);
  const dep = last24h.filter((t) => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
  const wd = last24h.filter((t) => t.type === "withdraw").reduce((s, t) => s + Number(t.amount), 0);
  if (dep + wd > 0) {
    const ratio = wd === 0 ? 100 : Math.round(((dep - wd) / Math.max(wd, 1)) * 100);
    out.push({
      id: "growth",
      kind: "growth",
      title: "24h net flow",
      detail: dep >= wd ? `Net inflow of INR ${(dep - wd).toLocaleString("en-IN")} (+${ratio}%)` : `Net outflow of INR ${(wd - dep).toLocaleString("en-IN")}`,
    });
  }

  return out.slice(0, 4);
}

export function buildAlerts(
  accounts: AdminAcct[],
  txs: AdminTx[],
  profiles: Record<string, AdminProfile>,
): AdminAlert[] {
  const alerts: AdminAlert[] = [];

  // Danger: large or odd-hour transactions
  txs.slice(0, 30).forEach((t) => {
    const h = new Date(t.created_at).getHours();
    const oddHour = h >= ODD_HOUR_START && h < ODD_HOUR_END;
    const large = Number(t.amount) >= LARGE_TX_THRESHOLD;
    if (oddHour || large) {
      alerts.push({
        id: `sus-${t.id}`,
        level: "danger",
        title: large ? "Suspicious large transaction" : "Off-hours transaction",
        detail: `${profileName(profiles, t.user_id)} - ${t.type} of INR ${Number(t.amount).toLocaleString("en-IN")}`,
        at: t.created_at,
      });
    }
  });

  // Warning: low balance
  accounts.forEach((a) => {
    if (Number(a.balance) < LOW_BALANCE_THRESHOLD) {
      alerts.push({
        id: `low-${a.id}`,
        level: "warning",
        title: "Low balance",
        detail: `${profileName(profiles, a.user_id)} - INR ${Number(a.balance).toLocaleString("en-IN")}`,
        at: a.created_at ?? new Date().toISOString(),
      });
    }
  });

  // Success: recent successful deposits
  txs
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .slice(0, 5)
    .forEach((t) => {
      alerts.push({
        id: `ok-${t.id}`,
        level: "success",
        title: "Deposit received",
        detail: `${profileName(profiles, t.user_id)} - INR ${Number(t.amount).toLocaleString("en-IN")}`,
        at: t.created_at,
      });
    });

  return alerts
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);
}
