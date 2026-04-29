import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGsapPage } from "@/hooks/useGsapPage";
import { toast } from "sonner";

import { CategoryGrid } from "@/components/bills/CategoryGrid";
import { BillSummaryCards } from "@/components/bills/BillSummaryCards";
import { UpcomingTimeline } from "@/components/bills/UpcomingTimeline";
import { SpendingChart } from "@/components/bills/SpendingChart";
import { nextDueDate, daysUntil, CATEGORY_MAP, type BillCategoryKey } from "@/lib/bills";
import { Skeleton } from "@/components/ui/skeleton";

interface Biller {
  id: string;
  name: string;
  category: BillCategoryKey;
  provider: string | null;
  account_ref: string | null;
  due_day: number | null;
  default_amount: number | null;
  autopay: boolean;
  created_at: string;
}

interface BillPayment {
  id: string;
  biller_id: string | null;
  category: BillCategoryKey;
  biller_name: string;
  amount: number;
  paid_at: string;
  period_label: string | null;
}

export default function Bills() {
  useGsapPage();
  const { user } = useAuth();
  const [billers, setBillers] = useState<Biller[]>([]);
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: bs, error: bsErr }, { data: ps, error: psErr }] = await Promise.all([
      supabase.from("billers")
        .select("id,name,category,provider,account_ref,due_day,default_amount,autopay,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase.from("bill_payments")
        .select("id,biller_id,category,biller_name,amount,paid_at,period_label")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false })
        .limit(200),
    ]);
    if (bsErr) toast.error(bsErr.message);
    if (psErr) toast.error(psErr.message);
    setBillers((bs ?? []) as Biller[]);
    setPayments((ps ?? []) as BillPayment[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthSpend = useMemo(
    () => payments
      .filter(p => new Date(p.paid_at) >= monthStart)
      .reduce((s, p) => s + Number(p.amount), 0),
    [payments, monthStart],
  );

  const lastMonthSpend = useMemo(() => {
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmEnd = monthStart;
    return payments
      .filter(p => { const d = new Date(p.paid_at); return d >= lmStart && d < lmEnd; })
      .reduce((s, p) => s + Number(p.amount), 0);
  }, [payments, now, monthStart]);

  const byCategoryThisMonth = useMemo(() => {
    const m = new Map<BillCategoryKey, number>();
    for (const p of payments) {
      if (new Date(p.paid_at) < monthStart) continue;
      m.set(p.category, (m.get(p.category) ?? 0) + Number(p.amount));
    }
    return [...m.entries()]
      .map(([k, v]) => ({ category: k, amount: v }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments, monthStart]);

  const upcoming = useMemo(() => {
    return billers
      .map(b => {
        const due = nextDueDate(b.due_day);
        return due ? { id: b.id, name: b.name, category: b.category, due, amount: b.default_amount, daysLeft: daysUntil(due) } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 6)
      .map(x => ({ ...x, dueDate: x.due }));
  }, [billers]);

  return (
    <div className="container py-8 max-w-5xl mx-auto pb-24">
      {/* Summary Cards */}
      <div className="mb-10" data-anim>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : (
          <BillSummaryCards spent={monthSpend} lastMonthSpent={lastMonthSpend} />
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 space-y-6" data-anim>
          {loading ? (
             <Skeleton className="h-64 w-full rounded-2xl" />
          ) : (
            <UpcomingTimeline items={upcoming} />
          )}
        </div>
        <div className="space-y-6" data-anim>
          {loading ? (
             <Skeleton className="h-64 w-full rounded-2xl" />
          ) : (
            <SpendingChart data={byCategoryThisMonth} />
          )}
        </div>
      </div>

      {/* Full Category Grid */}
      <div className="bg-card rounded-3xl border border-border/60 p-6 md:p-8 shadow-sm" data-anim>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold tracking-tight">Payment Categories</h2>
        </div>
        <CategoryGrid />
      </div>

    </div>
  );
}