import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Loader2, Users, DollarSign, Activity, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { QuickActions } from "@/components/admin/QuickActions";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { CustomerTable } from "@/components/admin/CustomerTable";
import { CustomerDetailDialog } from "@/components/admin/CustomerDetailDialog";
import { TransactionsPanel } from "@/components/admin/TransactionsPanel";
import { InsightsPanel } from "@/components/admin/InsightsPanel";
import { AdminBell } from "@/components/admin/AdminBell";
import { AdminAcct, AdminProfile, AdminTx, buildAlerts, buildInsights, profileName } from "@/lib/admin/insights";
import { downloadCsv } from "@/lib/admin/exportCsv";

const REFRESH_INTERVAL_MS = 10_000;

const Admin = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [accounts, setAccounts] = useState<AdminAcct[]>([]);
  const [profiles, setProfiles] = useState<Record<string, AdminProfile>>({});
  const [txs, setTxs] = useState<AdminTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveOn, setLiveOn] = useState(true);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [openAcct, setOpenAcct] = useState<AdminAcct | null>(null);
  const lastTxIdsRef = useRef<Set<string>>(new Set());

  const fetchAll = async (notify = false) => {
    const [{ data: a }, { data: p }, { data: tx }] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const newAccounts = ((a as AdminAcct[]) ?? []).map((x) => ({ ...x, balance: Number(x.balance) }));
    const map: Record<string, AdminProfile> = {};
    ((p as AdminProfile[]) ?? []).forEach((x) => (map[x.id] = x));
    const newTxs = ((tx as AdminTx[]) ?? []).map((x) => ({ ...x, amount: Number(x.amount) }));

    if (notify && lastTxIdsRef.current.size > 0) {
      const fresh = newTxs.filter((t) => !lastTxIdsRef.current.has(t.id));
      if (fresh.length) {
        const ids = new Set<string>(fresh.map((t) => t.id));
        setHighlightIds(ids);
        setTimeout(() => setHighlightIds(new Set()), 4000);
        fresh.slice(0, 3).forEach((t) => {
          const name = profileName(map, t.user_id);
          toast.success(`New ${t.type}`, {
            description: `${formatCurrency(t.amount)} - ${name}`,
          });
        });
      }
    }

    lastTxIdsRef.current = new Set(newTxs.map((t) => t.id));
    setAccounts(newAccounts);
    setProfiles(map);
    setTxs(newTxs);
  };

  useEffect(() => {
    (async () => {
      await fetchAll(false);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || !liveOn) return;
    const id = window.setInterval(() => fetchAll(true), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveOn, loading]);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".a-anim",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power3.out", clearProps: "all" },
      );
    }, ref);
    return () => ctx.revert();
  }, [loading]);

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + Number(a.balance), 0), [accounts]);
  const totalVolume = useMemo(() => txs.reduce((s, t) => s + Number(t.amount), 0), [txs]);
  const txByUser = useMemo(() => {
    const m: Record<string, number> = {};
    txs.forEach((t) => { m[t.user_id] = (m[t.user_id] ?? 0) + 1; });
    return m;
  }, [txs]);

  const insights = useMemo(() => buildInsights(accounts, txs, profiles), [accounts, txs, profiles]);
  const alerts = useMemo(() => buildAlerts(accounts, txs, profiles), [accounts, txs, profiles]);

  const handleExport = () => {
    const customerRows = accounts.map((a) => ({
      account_number: a.account_number,
      name: profileName(profiles, a.user_id),
      balance: Number(a.balance).toFixed(2),
      created_at: a.created_at ?? "",
    }));
    downloadCsv(`smartbank-customers-${Date.now()}.csv`, customerRows);
    const txRows = txs.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount).toFixed(2),
      status: t.status,
      customer: profileName(profiles, t.user_id),
      description: t.description ?? "",
      created_at: t.created_at,
    }));
    downloadCsv(`smartbank-transactions-${Date.now()}.csv`, txRows);
    toast.success("Reports downloaded", { description: `${customerRows.length} customers, ${txRows.length} transactions` });
  };

  const handleRefresh = async () => {
    await fetchAll(true);
    toast("Data refreshed", { description: `${accounts.length} customers, ${txs.length} transactions` });
  };

  const handleToggleLive = () => {
    setLiveOn((v) => {
      toast(v ? "Live updates paused" : "Live updates enabled", {
        description: v ? "Data will not auto-refresh" : "Refreshing every 10 seconds",
      });
      return !v;
    });
  };

  if (loading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );

  const openProfile = openAcct ? profiles[openAcct.user_id] ?? null : null;

  return (
    <div ref={ref} className="container mx-auto max-w-7xl py-8 pb-24">
      {/* Header */}
      <div className="a-anim flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            {t("admin.badge")}
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t("admin.title")}</h1>
            <p className="text-xs text-muted-foreground">Live operational view of customers, balances, and money movement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] backdrop-blur-md`}>
            <span className={`h-1.5 w-1.5 rounded-full ${liveOn ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
            {liveOn ? "Live" : "Paused"}
          </span>
          <AdminBell alerts={alerts} />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="a-anim"><StatCard icon={Users} label={t("admin.totalCustomers")} value={accounts.length} accent="primary" /></div>
        <div className="a-anim"><StatCard icon={DollarSign} label={t("admin.auc")} value={totalBalance} format={(n) => formatCurrency(n)} accent="emerald" /></div>
        <div className="a-anim"><StatCard icon={Activity} label={t("admin.recentTx")} value={txs.length} accent="violet" trendLabel={`${txs.filter(t => Date.now() - new Date(t.created_at).getTime() < 86_400_000).length} in last 24h`} /></div>
        <div className="a-anim"><StatCard icon={TrendingUp} label={t("admin.recentVol")} value={totalVolume} format={(n) => formatCurrency(n)} accent="amber" /></div>
      </div>

      {/* Quick actions */}
      <div className="a-anim mt-6">
        <QuickActions onRefresh={handleRefresh} onExport={handleExport} liveOn={liveOn} onToggleLive={handleToggleLive} />
      </div>

      {/* Charts */}
      <div className="a-anim mt-8">
        <AdminCharts txs={txs} accounts={accounts} profiles={profiles} />
      </div>

      {/* Insights */}
      <div className="a-anim mt-8">
        <InsightsPanel insights={insights} />
      </div>

      {/* Customers + Transactions */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="a-anim">
          <CustomerTable accounts={accounts} profiles={profiles} txByUser={txByUser} onView={(a) => setOpenAcct(a)} />
        </div>
        <div className="a-anim">
          <TransactionsPanel txs={txs} profiles={profiles} highlightIds={highlightIds} />
        </div>
      </div>

      <CustomerDetailDialog
        open={!!openAcct}
        onClose={() => setOpenAcct(null)}
        account={openAcct}
        profile={openProfile}
        txs={txs}
      />
    </div>
  );
};

export default Admin;
