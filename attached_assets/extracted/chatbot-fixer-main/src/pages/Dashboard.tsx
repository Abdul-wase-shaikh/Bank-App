import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, Send, Loader2, TrendingUp, Wallet, Eye, EyeOff, BarChart3 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DigitalCard } from "@/components/DigitalCard";
import { TxnPinConfirmDialog } from "@/components/TxnPinConfirmDialog";
import { SuccessDialog } from "@/components/SuccessDialog";

type Account = { id: string; account_number: string; balance: number; currency: string; created_at?: string };
type Tx = { id: string; type: string; amount: number; description: string | null; created_at: string; from_account: string | null; to_account: string | null };
type Action = "deposit" | "withdraw" | "transfer" | null;

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBal, setShowBal] = useState(true);
  const [action, setAction] = useState<Action>(null);
  const [amount, setAmount] = useState("");
  const [toAcct, setToAcct] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [trend, setTrend] = useState<{ date: string; label: string; spent: number; received: number }[]>([]);
  const [totals, setTotals] = useState({ spent: 0, received: 0 });
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successDetail, setSuccessDetail] = useState<{ title: string; description: string } | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date(); since.setHours(0,0,0,0); since.setDate(since.getDate() - 6);
    const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const [{ data: a }, { data: p }, { data: tx }, { data: t7 }] = await Promise.all([
      supabase.from("accounts").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("transactions").select("type,amount,created_at").eq("user_id", user.id).gte("created_at", since.toISOString()),
    ]);
    setAccount(a as any);
    setProfile(p as any);
    setTxs((tx as any) ?? []);

    const buckets: Record<string, { spent: number; received: number }> = {};
    const labels: Record<string, string> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(since); d.setDate(since.getDate() + i);
      const k = dayKey(d);
      buckets[k] = { spent: 0, received: 0 };
      labels[k] = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    let totalSpent = 0, totalReceived = 0;
    ((t7 as any[]) ?? []).forEach(row => {
      const k = dayKey(new Date(row.created_at));
      if (!buckets[k]) return;
      const amt = Number(row.amount) || 0;
      if (row.type === "deposit") { buckets[k].received += amt; totalReceived += amt; }
      else { buckets[k].spent += amt; totalSpent += amt; }
    });
    const series = Object.entries(buckets).map(([date, v]) => ({
      date, label: labels[date],
      spent: Number(v.spent.toFixed(2)),
      received: Number(v.received.toFixed(2)),
    }));
    setTrend(series);
    setTotals({ spent: totalSpent, received: totalReceived });
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".d-anim", { y: 25, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" });
    }, ref);
    return () => ctx.revert();
  }, [loading]);

  const requestSubmit = () => {
    if (!action || !amount) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error(t("dashboard.validAmount")); return; }
    if (action === "transfer" && !toAcct.trim()) { toast.error(t("dashboard.validAmount")); return; }
    // Withdrawals + transfers require the 6-digit transaction PIN (or biometric).
    if (action === "withdraw" || action === "transfer") {
      setPinPromptOpen(true);
      return;
    }
    executeSubmit();
  };

  const executeSubmit = async (proof?: { txnPin?: string; biometricCredentialId?: string }) => {
    if (!action || !amount) return;
    const amt = parseFloat(amount);
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("banking", {
      body: {
        action,
        amount: amt,
        to_account: toAcct || null,
        description: desc || null,
        txn_pin: proof?.txnPin,
        biometric_credential_id: proof?.biometricCredentialId,
      },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || t("dashboard.txFailed")); return; }
    const labelMap: Record<string, string> = {
      deposit: "Deposit successful!",
      withdraw: "Withdrawal successful!",
      transfer: "Payment succeeded!",
    };
    const fmtAmt = formatCurrency(amt, account?.currency);
    setSuccessDetail({
      title: labelMap[action] || "Payment succeeded!",
      description:
        action === "transfer"
          ? `${fmtAmt} has been sent to ${toAcct}. Thank you for using SmartBank.`
          : `${fmtAmt} ${action === "deposit" ? "has been added to" : "has been withdrawn from"} your account.`,
    });
    setSuccessOpen(true);
    setAction(null); setAmount(""); setToAcct(""); setDesc("");
    load();
  };

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div ref={ref} className="container py-10">
      <div className="d-anim flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground">{t("dashboard.welcome")}</div>
          <h1 className="font-display text-3xl md:text-4xl">{user?.email?.split("@")[0]}</h1>
        </div>
        <div className="text-xs font-mono text-muted-foreground">{t("dashboard.account")} · {account?.account_number}</div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 items-stretch">
        <div className="d-anim flex items-center justify-center">
          <DigitalCard
            holderName={profile?.full_name || user?.email?.split("@")[0] || "Card Holder"}
            accountNumber={account?.account_number || ""}
            balance={Number(account?.balance ?? 0)}
            currency={account?.currency}
            createdAt={(account as any)?.created_at}
          />
        </div>
        <div className="d-anim glass-card p-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-gradient-primary blur-3xl opacity-30" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                {t("dashboard.available")}
                <button onClick={() => setShowBal(b => !b)} className="text-muted-foreground hover:text-foreground">
                  {showBal ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 font-display text-5xl md:text-6xl font-bold text-gradient">
                {showBal ? formatCurrency(account?.balance ?? 0, account?.currency) : "••••••"}
              </div>
            </div>
            <div className="hidden md:grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><Wallet className="h-7 w-7" /></div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <Button variant="outline" onClick={() => setAction("deposit")} className="h-auto py-4 flex-col gap-2"><ArrowDownToLine className="h-5 w-5 text-primary" /><span className="text-xs">{t("dashboard.deposit")}</span></Button>
            <Button variant="outline" onClick={() => setAction("withdraw")} className="h-auto py-4 flex-col gap-2"><ArrowUpFromLine className="h-5 w-5 text-primary" /><span className="text-xs">{t("dashboard.withdraw")}</span></Button>
            <Button variant="outline" onClick={() => setAction("transfer")} className="h-auto py-4 flex-col gap-2"><Send className="h-5 w-5 text-primary" /><span className="text-xs">{t("dashboard.transfer")}</span></Button>
          </div>
        </div>
      </div>

      {action && (
        <div className="d-anim glass-card p-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t(`dashboard.${action}`)}</h3>
            <button onClick={() => setAction(null)} className="text-sm text-muted-foreground hover:text-foreground">{t("dashboard.cancel")}</button>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">{t("dashboard.amount")}</label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
            </div>
            {action === "transfer" && (
              <div>
                <label className="text-sm">{t("dashboard.recipient")}</label>
                <input value={toAcct} onChange={e=>setToAcct(e.target.value)} placeholder="SB0000000000" className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50 font-mono" />
              </div>
            )}
            <div className={action === "transfer" ? "sm:col-span-2" : ""}>
              <label className="text-sm">{t("dashboard.description")}</label>
              <input value={desc} onChange={e=>setDesc(e.target.value)} maxLength={120} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
            </div>
          </div>
          <Button onClick={requestSubmit} disabled={submitting} className="mt-5 bg-gradient-primary text-primary-foreground">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("dashboard.confirm", { action: t(`dashboard.${action}`) })}
          </Button>
        </div>
      )}

      <div className="d-anim glass-card p-6 mt-8">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> {t("dashboard.analytics")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.analyticsSub")}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{t("dashboard.received")}</div>
              <div className="font-semibold text-primary">{formatCurrency(totals.received, account?.currency)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("dashboard.spent")}</div>
              <div className="font-semibold text-accent">{formatCurrency(totals.spent, account?.currency)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("dashboard.net")}</div>
              <div className={`font-semibold ${totals.received - totals.spent >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(totals.received - totals.spent, account?.currency)}
              </div>
            </div>
          </div>
        </div>
        <div className="h-64 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={0} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(v: number, name) => [formatCurrency(v, account?.currency), name === "received" ? t("dashboard.received") : t("dashboard.spent")]}
              />
              <Area type="monotone" dataKey="received" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gReceived)" />
              <Area type="monotone" dataKey="spent" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#gSpent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="d-anim mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> {t("dashboard.recent")}</h3>
          <Link to="/transactions" className="text-sm text-primary hover:underline">{t("dashboard.viewAll")}</Link>
        </div>
        <div className="glass-card divide-y divide-border/60">
          {txs.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">{t("dashboard.noTx")}</div>}
          {txs.map(tx => (
            <div key={tx.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full grid place-items-center ${tx.type === "deposit" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                  {tx.type === "deposit" ? <ArrowDownToLine className="h-4 w-4" /> : tx.type === "withdraw" ? <ArrowUpFromLine className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-medium text-sm">{t(`dashboard.${tx.type}`)}</div>
                  <div className="text-xs text-muted-foreground">{tx.description || "—"} · {formatDate(tx.created_at)}</div>
                </div>
              </div>
              <div className={`font-semibold ${tx.type === "deposit" ? "text-primary" : "text-foreground"}`}>
                {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount, account?.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TxnPinConfirmDialog
        open={pinPromptOpen}
        onOpenChange={setPinPromptOpen}
        onConfirmed={(proof) => executeSubmit(proof)}
        title={action === "transfer" ? t("dashboard.transfer") : t("dashboard.withdraw")}
        description={
          action && amount
            ? `${t("dashboard.confirm", { action: t(`dashboard.${action}`) })} — ${formatCurrency(parseFloat(amount) || 0, account?.currency)}`
            : undefined
        }
      />

      <SuccessDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        title={successDetail?.title || "Payment succeeded!"}
        description={successDetail?.description || "Your transaction was completed successfully."}
        ctaLabel="Go to Your Dashboard"
      />
    </div>
  );
};
export default Dashboard;
