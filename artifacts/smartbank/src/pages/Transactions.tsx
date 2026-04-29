import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/format";
import { Loader2, ArrowDownToLine, ArrowUpFromLine, Send } from "lucide-react";

type Tx = { id: string; type: string; amount: number; description: string | null; created_at: string; status: string; from_account: string | null; to_account: string | null };

const TransactionsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "deposit" | "withdraw" | "transfer">("all");

  useEffect(() => {
    if (!user) return;
    supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setTxs((data as any) ?? []);
      setLoading(false);
    });
  }, [user]);

  const filtered = filter === "all" ? txs : txs.filter(tx => tx.type === filter);
  const Icon = (ty: string) => ty === "deposit" ? ArrowDownToLine : ty === "withdraw" ? ArrowUpFromLine : Send;

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl md:text-4xl">{t("tx.title")}</h1>
      <p className="text-muted-foreground text-sm mt-1">{t("tx.total", { count: txs.length })}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all","deposit","withdraw","transfer"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
            {t(`tx.${f}`)}
          </button>
        ))}
      </div>

      <div className="mt-6 glass-card divide-y divide-border/60">
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">{t("tx.noMatch")}</div>}
        {filtered.map(tx => {
          const I = Icon(tx.type);
          return (
            <div key={tx.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full grid place-items-center ${tx.type === "deposit" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}><I className="h-4 w-4" /></div>
                <div>
                  <div className="font-medium text-sm">{t(`tx.${tx.type}`)}{tx.to_account && tx.type === "transfer" ? ` → ${tx.to_account}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{tx.description || "—"} · {formatDate(tx.created_at)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${tx.type === "deposit" ? "text-primary" : "text-foreground"}`}>
                  {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                </div>
                <div className="text-xs text-muted-foreground">{tx.status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TransactionsPage;
