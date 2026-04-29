import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGsapPage } from "@/hooks/useGsapPage";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Sparkles, Settings2, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function Subscriptions() {
  useGsapPage();
  const { user } = useAuth();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!user) return;
      setLoading(true);
      
      // Fetch both billers (saved subs) and payments (to detect ones not explicitly saved)
      const [{ data: billers }, { data: payments }] = await Promise.all([
        supabase.from("billers").select("*").eq("user_id", user.id).in("category", ["ott", "music", "gaming", "other_subscription"]),
        supabase.from("bill_payments").select("*").eq("user_id", user.id).in("category", ["ott", "music", "gaming", "other_subscription"])
      ]);

      // Combine and deduplicate
      const subMap = new Map();
      
      if (billers) {
        billers.forEach(b => {
          subMap.set(b.name.toLowerCase(), {
            id: b.id,
            name: b.name,
            amount: b.default_amount || 0,
            autopay: b.autopay,
            isSaved: true
          });
        });
      }

      if (payments) {
        payments.forEach(p => {
          const key = p.biller_name.toLowerCase();
          if (!subMap.has(key)) {
            subMap.set(key, {
              id: `un-${p.id}`,
              name: p.biller_name,
              amount: p.amount,
              autopay: false,
              isSaved: false
            });
          }
        });
      }

      setSubs(Array.from(subMap.values()));
      setLoading(false);
    };

    fetchSubs();
  }, [user]);

  const totalMonthly = subs.reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="container py-8 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8" data-anim>
        <Link to="/bills" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-pink-500/5 text-pink-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-display font-bold">Subscriptions Hub</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" data-anim>
        <Card className="md:col-span-2 glass-card bg-gradient-primary text-primary-foreground border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="h-32 w-32" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-primary-foreground/80 text-sm font-medium mb-1">Total Monthly Spend</p>
            <h2 className="text-4xl font-bold tracking-tight mb-4">{formatCurrency(totalMonthly)}</h2>
            <p className="text-sm text-primary-foreground/90">
              You have {subs.length} active subscriptions detected.
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Renewal Alerts</h3>
            <p className="text-xs text-muted-foreground">Get notified before you get charged.</p>
          </CardContent>
        </Card>
      </div>

      <div data-anim>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold tracking-tight">Active Subscriptions</h3>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : subs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-3xl border border-border/60">
            <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-1">No subscriptions found</h3>
            <p className="text-sm text-muted-foreground">Pay a subscription to see it tracked here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subs.map((sub, i) => (
              <div key={i} className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary/50 flex items-center justify-center font-bold text-lg text-foreground">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-0.5 flex items-center gap-2">
                      {sub.name}
                      {!sub.isSaved && <Badge variant="outline" className="text-[10px]">Auto-detected</Badge>}
                    </h4>
                    <p className="text-xs text-muted-foreground">{formatCurrency(sub.amount)} / month</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium mb-1">Autopay</span>
                    <Switch checked={sub.autopay} disabled={!sub.isSaved} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}