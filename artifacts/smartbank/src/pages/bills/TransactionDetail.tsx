import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGsapPage } from "@/hooks/useGsapPage";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Receipt, Download, Share2, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_MAP, type BillCategoryKey } from "@/lib/bills";

export default function TransactionDetail() {
  useGsapPage();
  const { id } = useParams();
  const { user } = useAuth();
  const [txn, setTxn] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTxn = async () => {
      if (!user || !id) return;
      setLoading(true);
      const { data } = await supabase
        .from("bill_payments")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setTxn(data);
      setLoading(false);
    };
    fetchTxn();
  }, [id, user]);

  if (loading) {
    return <div className="container py-12 flex justify-center"><Skeleton className="h-64 w-full max-w-md rounded-3xl" /></div>;
  }

  if (!txn) {
    return <div className="container py-12 text-center">Transaction not found.</div>;
  }

  const meta = CATEGORY_MAP[txn.category as BillCategoryKey] || CATEGORY_MAP["other"];

  return (
    <div className="container py-8 max-w-md mx-auto pb-24" data-anim>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/bills" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-display font-bold">Transaction Details</h1>
      </div>

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm text-center">
        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Payment Successful</h2>
        <div className="text-sm text-muted-foreground mb-8">{formatDate(txn.paid_at)}</div>

        <div className="text-5xl font-bold tracking-tight mb-8">
          {formatCurrency(txn.amount)}
        </div>

        <div className="bg-secondary/30 rounded-2xl p-4 space-y-4 text-left border border-border/40 mb-8">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Paid To</span>
            <span className="font-semibold flex items-center gap-2">
              <meta.icon className="h-4 w-4" /> {txn.biller_name}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Category</span>
            <span className="font-medium">{meta.label}</span>
          </div>
          {txn.period_label && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Details</span>
              <span className="font-medium">{txn.period_label}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-emerald-500 capitalize">{txn.status}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl">
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <Button variant="outline" className="flex-1 rounded-xl">
            <Download className="h-4 w-4 mr-2" /> Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}